"""
File Overview:
This module defines the service layer for the AI Chat API application.
It includes methods for initializing AI models, converting messages to LangChain format,
retrieving appropriate models, and processing chat requests.

File Path:
pyserver/app/services.py
"""

from typing import List, Optional, AsyncGenerator, Union, cast
from fastapi import HTTPException
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import HumanMessage, AIMessage, SystemMessage, BaseMessage
from app.config import settings, ChatProvider
from app.models import ChatMessage, MessageRole
from app.utils import Timer, log_chat_request, sanitize_response  # Assuming these exist
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import logging

logger = logging.getLogger(__name__)

class ChatService:
    """Handles chat interactions with multiple AI providers."""

    def __init__(self):
        self.models = {}  # Initialize as an empty dictionary
        self._init_models()

    def _init_models(self):
        """Initialize AI models for each *enabled* provider."""
        for provider, enabled in settings.ENABLED_PROVIDERS.items():
            if not enabled:
                continue  # Skip if the provider is not enabled

            try:
                if provider == ChatProvider.GPT:
                    if settings.OPENAI_API_KEY is None:
                        logger.warning("OpenAI API key not found, skipping GPT model initialization.")
                        continue # Skip to the next provider
                    model_config = settings.MODEL_CONFIGS[provider]
                    self.models[provider] = ChatOpenAI(
                        api_key=settings.OPENAI_API_KEY,
                        model=model_config["default"],
                        temperature=model_config["temperature"],
                        max_tokens=model_config["max_tokens"],
                        streaming=True
                    )
                elif provider == ChatProvider.CLAUDE:
                    if settings.ANTHROPIC_API_KEY is None:
                        logger.warning("Anthropic API key not found, skipping Claude model initialization.")
                        continue
                    model_config = settings.MODEL_CONFIGS[provider]
                    self.models[provider] = ChatAnthropic(
                        api_key=settings.ANTHROPIC_API_KEY,
                        model_name=model_config["default"], #Anthropic uses model_name
                        temperature=model_config["temperature"],
                        max_tokens=model_config["max_tokens"],
                        streaming=True
                    )
                elif provider == ChatProvider.GEMINI:
                    if settings.GEMINI_API_KEY is None:
                        logger.warning("Gemini API key not found, skipping Gemini model initialization.")
                        continue
                    model_config = settings.MODEL_CONFIGS[provider]
                    self.models[provider] = ChatGoogleGenerativeAI(
                        api_key=settings.GEMINI_API_KEY,
                        model=model_config["default"],
                        temperature=model_config["temperature"],
                        max_tokens=model_config["max_tokens"],
                        streaming=True
                    )
            except Exception as e:
                logger.error(f"Failed to initialize model for {provider}: {str(e)}")
                #  Don't raise an exception here; just log and continue.  A missing model is handled later.

    def _convert_messages(self, messages: List[ChatMessage]) -> List[BaseMessage]:
        """Convert chat messages to LangChain format."""
        langchain_messages: List[BaseMessage] = []
        for msg in messages:
            content = msg.content
            if msg.role == MessageRole.USER:
                langchain_messages.append(HumanMessage(content=content))
            elif msg.role == MessageRole.ASSISTANT:
                langchain_messages.append(AIMessage(content=content))
            elif msg.role == MessageRole.SYSTEM:
                langchain_messages.append(SystemMessage(content=content))
        return langchain_messages

    def _get_model(self, provider: ChatProvider, model_name: Optional[str] = None) -> any:
        """Get the appropriate model instance with error handling."""
        if provider not in self.models:
            raise HTTPException(
                status_code=503,
                detail={"error": "PROVIDER_NOT_AVAILABLE", "message": f"{provider} is not enabled or initialization failed."}
            )

        config = settings.MODEL_CONFIGS[provider]
        
        # If no model specified or invalid model, use default
        if not model_name or model_name not in [config["default"], config["fallback"]]:
            if model_name:  # If invalid model was specified
                raise HTTPException(
                    status_code=400,
                    detail={
                        "error": "INVALID_MODEL",
                        "message": f"Model '{model_name}' is not valid for {provider}. Valid models are: {[config['default'], config['fallback']]}",
                        "valid_models": [config["default"], config["fallback"]]
                    }
                )
            return self.models[provider]

        # Create new model instance for valid specific model
        try:
            model_class = type(self.models[provider])
            # Map provider to correct settings key
            api_key_map = {
                ChatProvider.GPT: "OPENAI_API_KEY",
                ChatProvider.CLAUDE: "ANTHROPIC_API_KEY",
                ChatProvider.GEMINI: "GEMINI_API_KEY"
            }
            api_key = getattr(settings, api_key_map[provider])
            
            if not api_key:
                raise HTTPException(
                    status_code=503,
                    detail={"error": "API_KEY_MISSING", "message": f"API key for {provider} is missing."}
                )

            model_kwargs = {
                "api_key": api_key,
                "temperature": config["temperature"],
                "max_tokens": config["max_tokens"],
                "streaming": True
            }
            
            if provider == ChatProvider.CLAUDE:
                model_kwargs["model_name"] = model_name
            else:
                model_kwargs["model"] = model_name

            return model_class(**model_kwargs)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail={"error": "MODEL_INITIALIZATION_FAILED", "message": str(e)}
            )

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        retry=retry_if_exception_type(Exception),  # Consider more specific exception types
        retry_error_callback=lambda retry_state: logger.error(f"Request failed after {retry_state.attempt_number} attempts: {retry_state.outcome.exception()}")
    )
    async def chat(
        self,
        messages: List[ChatMessage],
        provider: ChatProvider,
        model: Optional[str] = None
    ) -> str:
        with Timer() as timer:
            try:
                model_instance = self._get_model(provider, model)  # This can raise HTTPException
                langchain_messages = self._convert_messages(messages)

                try:
                    response = await model_instance.ainvoke(langchain_messages)
                except Exception as e:
                    logger.error(f"Model invocation failed: {str(e)}")
                    # Fallback logic (only if a specific model wasn't requested)
                    if model is None or model != settings.MODEL_CONFIGS[provider]["fallback"]:
                        fallback_model = settings.MODEL_CONFIGS[provider]["fallback"]
                        logger.info(f"Attempting fallback to {fallback_model}")
                        try:
                            model_instance = self._get_model(provider, fallback_model) #This can also now raise
                            response = await model_instance.ainvoke(langchain_messages)
                        except HTTPException as fallback_exc:  # Catch specific HTTPException from _get_model
                            raise fallback_exc
                        except Exception as fallback_e:
                            logger.error(f"Fallback failed: {str(fallback_e)}")
                            raise HTTPException(status_code=500, detail=f"Fallback to {fallback_model} failed: {str(fallback_e)}")
                    else:  # No fallback, or fallback already attempted
                        raise HTTPException(status_code=500, detail=f"Model invocation failed: {str(e)}")

                content = sanitize_response(response.content)

                log_chat_request(
                    provider=provider.value,
                    messages=messages,
                    duration_ms=timer.duration,
                    success=True,
                    model=model or settings.MODEL_CONFIGS[provider]["default"]
                )

                return content

            except HTTPException as e:  # Catch HTTPExceptions from _get_model or model invocation
                log_chat_request(
                    provider=provider.value,
                    messages=messages,
                    duration_ms=timer.duration,
                    success=False,
                    error=e,  # Log the exception object directly
                    model=model
                )
                raise  # Re-raise the HTTPException

            except Exception as e: # Catch any other Exception
                log_chat_request(
                    provider=provider.value,
                    messages=messages,
                    duration_ms=timer.duration,
                    success=False,
                    error=e,
                    model=model
                )
                raise HTTPException(
                    status_code=500,
                    detail=str(e)
                )

    async def chat_stream(
        self,
        messages: List[ChatMessage],
        provider: ChatProvider,
        model: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """
        Process a chat request and stream the response.
        """
        with Timer() as timer:
            try:
                model_instance = self._get_model(provider, model) # This can raise HTTPException
                langchain_messages = self._convert_messages(messages)

                async for chunk in model_instance.astream(langchain_messages):
                    if chunk.content:
                        yield sanitize_response(chunk.content)

                log_chat_request(
                    provider=provider.value,
                    messages=messages,
                    duration_ms=timer.duration,
                    success=True,
                    model=model or settings.MODEL_CONFIGS[provider]["default"]
                )

            except HTTPException as e: # Catch HTTPExceptions from _get_model
                log_chat_request(
                    provider=provider.value,
                    messages=messages,
                    duration_ms=timer.duration,
                    success=False,
                    error=e,
                    model=model or settings.MODEL_CONFIGS[provider]["default"]
                )
                raise # Re-raise
            except Exception as e:
                log_chat_request(
                    provider=provider.value,
                    messages=messages,
                    duration_ms=timer.duration,
                    success=False,
                    error=e,
                    model=model or settings.MODEL_CONFIGS[provider]["default"]

                )
                raise HTTPException(
                    status_code=500,
                    detail=f"Streaming chat completion failed: {str(e)}"
                )

# Create global chat service instance
chat_service = ChatService()