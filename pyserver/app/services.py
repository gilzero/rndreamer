from typing import List, Optional, AsyncGenerator
from fastapi import HTTPException
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import HumanMessage, AIMessage, SystemMessage
from app.config import settings, ChatProvider
from app.models import ChatMessage, MessageRole
from app.utils import Timer, log_chat_request, sanitize_response

class ChatService:
    """Main chat service handling multiple AI providers"""
    
    def __init__(self):
        self._init_models()
    
    def _init_models(self):
        """Initialize AI models"""
        self.models = {
            ChatProvider.GPT: ChatOpenAI(
                api_key=settings.OPENAI_API_KEY,
                model=settings.MODEL_CONFIGS[ChatProvider.GPT]["default"],
                temperature=settings.MODEL_CONFIGS[ChatProvider.GPT]["temperature"],
                max_tokens=settings.MODEL_CONFIGS[ChatProvider.GPT]["max_tokens"],
                streaming=True
            ),
            ChatProvider.CLAUDE: ChatAnthropic(
                api_key=settings.ANTHROPIC_API_KEY,
                model=settings.MODEL_CONFIGS[ChatProvider.CLAUDE]["default"],
                temperature=settings.MODEL_CONFIGS[ChatProvider.CLAUDE]["temperature"],
                max_tokens=settings.MODEL_CONFIGS[ChatProvider.CLAUDE]["max_tokens"],
                streaming=True
            ),
            ChatProvider.GEMINI: ChatGoogleGenerativeAI(
                api_key=settings.GEMINI_API_KEY,
                model=settings.MODEL_CONFIGS[ChatProvider.GEMINI]["default"],
                temperature=settings.MODEL_CONFIGS[ChatProvider.GEMINI]["temperature"],
                max_tokens=settings.MODEL_CONFIGS[ChatProvider.GEMINI]["max_tokens"],
                streaming=True
            )
        }
    
    def _convert_messages(self, messages: List[ChatMessage]) -> List[HumanMessage | AIMessage | SystemMessage]:
        """Convert chat messages to LangChain format"""
        langchain_messages = []
        for msg in messages:
            content = msg.content
            if msg.role == MessageRole.USER:
                langchain_messages.append(HumanMessage(content=content))
            elif msg.role == MessageRole.ASSISTANT:
                langchain_messages.append(AIMessage(content=content))
            elif msg.role == MessageRole.SYSTEM:
                langchain_messages.append(SystemMessage(content=content))
        return langchain_messages

    def _get_model(self, provider: ChatProvider, model: Optional[str] = None) -> any:
        """Get appropriate model instance with fallback handling"""
        if model and model not in settings.MODEL_CONFIGS[provider]["allowed"]:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid model for {provider}. Allowed models: {settings.MODEL_CONFIGS[provider]['allowed']}"
            )
        
        try:
            if model:
                # Create new instance with specified model
                model_config = self.models[provider]._client_params
                model_config['model'] = model
                return type(self.models[provider])(**model_config)
            return self.models[provider]
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to initialize {provider} model: {str(e)}"
            )

    async def chat(
        self,
        messages: List[ChatMessage],
        provider: ChatProvider,
        model: Optional[str] = None
    ) -> str:
        """Process a chat request and return a response"""
        with Timer() as timer:
            try:
                model_instance = self._get_model(provider, model)
                langchain_messages = self._convert_messages(messages)
                
                response = await model_instance.ainvoke(langchain_messages)
                content = sanitize_response(response.content)
                
                log_chat_request(
                    provider=provider.value,
                    messages=messages,
                    duration_ms=timer.duration,
                    success=True
                )
                
                return content
                
            except Exception as e:
                log_chat_request(
                    provider=provider.value,
                    messages=messages,
                    duration_ms=timer.duration,
                    success=False,
                    error=e
                )
                raise HTTPException(
                    status_code=500,
                    detail=f"Chat completion failed: {str(e)}"
                )

    async def chat_stream(
        self,
        messages: List[ChatMessage],
        provider: ChatProvider,
        model: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """Process a chat request and stream the response"""
        with Timer() as timer:
            try:
                model_instance = self._get_model(provider, model)
                langchain_messages = self._convert_messages(messages)
                
                async for chunk in model_instance.astream(langchain_messages):
                    if chunk.content:
                        yield sanitize_response(chunk.content)
                
                log_chat_request(
                    provider=provider.value,
                    messages=messages,
                    duration_ms=timer.duration,
                    success=True
                )
                
            except Exception as e:
                log_chat_request(
                    provider=provider.value,
                    messages=messages,
                    duration_ms=timer.duration,
                    success=False,
                    error=e
                )
                raise HTTPException(
                    status_code=500,
                    detail=f"Streaming chat completion failed: {str(e)}"
                )

# Create global chat service instance
chat_service = ChatService()
