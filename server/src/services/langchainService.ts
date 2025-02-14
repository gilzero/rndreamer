import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { BaseMessage, AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Response } from 'express';

/**
 * Type definitions for model providers and message structures
 */
type ModelProvider = 'gpt' | 'claude' | 'gemini';
type Message = { role: 'user' | 'assistant' | 'system'; content: string };

/**
 * Configuration interface for individual model settings
 */
type ModelConfig = {
  default: string;      // Default model identifier
  fallback: string;     // Fallback model identifier
  temperature: number;  // Temperature setting for the model
  maxTokens: number;    // Maximum tokens for the model
};

/**
 * Configuration mapping for all supported model providers
 */
type ModelConfigs = {
  [K in ModelProvider]: ModelConfig;
};

/**
 * Options interface for chat interactions
 */
interface ChatOptions {
  provider: ModelProvider;  // The AI provider to use
  model?: string;          // Optional specific model identifier (uses default if not provided)
  temperature?: number;    // Optional temperature setting (uses provider default if not provided)
}

/**
 * Structure for streaming response chunks
 */
interface StreamResponse {
  id: string;             // Unique message identifier
  delta: {
    content: string;      // Chunk of response content
  };
}

/**
 * Custom error class for chat-related errors with provider context
 */
class ChatError extends Error {
  constructor(
    message: string,
    public provider: ModelProvider,
    public statusCode: number = 500,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'ChatError';
  }
}

/**
 * Configuration constants loaded from environment variables
 * Maps provider configurations including default/fallback models and settings
 */
const MODEL_CONFIGS: ModelConfigs = {
  gpt: {
    default: process.env.OPENAI_MODEL_DEFAULT || 'gpt-4o',
    fallback: process.env.OPENAI_MODEL_FALLBACK || 'gpt-4o-mini',
    temperature: Number(process.env.OPENAI_TEMPERATURE || 0.3),
    maxTokens: Number(process.env.OPENAI_MAX_TOKENS || 8192),
  },
  claude: {
    default: process.env.ANTHROPIC_MODEL_DEFAULT || 'claude-3-5-sonnet-latest',
    fallback: process.env.ANTHROPIC_MODEL_FALLBACK || 'claude-3-5-haiku-latest',
    temperature: Number(process.env.ANTHROPIC_TEMPERATURE || 0.3),
    maxTokens: Number(process.env.ANTHROPIC_MAX_TOKENS || 8192),
  },
  gemini: {
    default: process.env.GEMINI_MODEL_DEFAULT || 'gemini-2.0-flash',
    fallback: process.env.GEMINI_MODEL_FALLBACK || 'gemini-1.5-pro',
    temperature: Number(process.env.GEMINI_TEMPERATURE || 0.3),
    maxTokens: Number(process.env.GEMINI_MAX_TOKENS || 8192),
  }
};

/**
 * Service class for handling chat interactions with various AI models through LangChain
 * Provides unified interface for multiple AI providers (GPT, Claude, Gemini)
 * Supports both streaming and non-streaming chat completions
 */
export class LangChainService {
  /**
   * Validates the format and content of chat messages
   * @param messages - Array of chat messages to validate
   * @throws {ChatError} If messages are invalid, empty, or have incorrect format
   * @remarks Ensures all messages have valid roles and non-empty content
   */
  private validateMessages(messages: Message[]) {
    if (!messages?.length) {
      throw new ChatError('No messages provided', 'gpt', 400);
    }
    
    for (const msg of messages) {
      if (!msg.content?.trim()) {
        throw new ChatError('Empty message content', 'gpt', 400);
      }
      if (!['user', 'assistant', 'system'].includes(msg.role)) {
        throw new ChatError(`Invalid message role: ${msg.role}`, 'gpt', 400);
      }
    }
  }

  /**
   * Converts generic Message objects to LangChain-specific message types
   * @param messages - Array of generic messages to convert
   * @returns Array of LangChain BaseMessage instances
   * @throws {ChatError} If message role is unsupported
   * @remarks Maps user/assistant/system roles to corresponding LangChain message classes
   */
  private convertMessages(messages: Message[]): BaseMessage[] {
    return messages.map(msg => {
      switch (msg.role) {
        case 'user':
          return new HumanMessage(msg.content);
        case 'assistant':
          return new AIMessage(msg.content);
        case 'system':
          return new SystemMessage(msg.content);
        default:
          throw new ChatError(`Unsupported message role: ${msg.role}`, 'gpt', 400);
      }
    });
  }

  /**
   * Resolves the actual model name based on provider and model configuration
   * @param provider - The AI provider (gpt, claude, gemini)
   * @param model - The requested model name (optional)
   * @returns Resolved model name from configuration
   * @throws {ChatError} If model is not supported by the provider
   * @remarks Uses exact model names from environment configuration
   */
  private getModelName(provider: ModelProvider, model?: string): string {
    const config = MODEL_CONFIGS[provider];
    
    // If no specific model requested, use default from config
    if (!model) {
      return config.default;
    }

    // Convert model name to lowercase for case-insensitive comparison
    const normalizedModel = model.toLowerCase();
    const defaultModel = config.default.toLowerCase();
    const fallbackModel = config.fallback.toLowerCase();

    // Check against normalized model names
    if (normalizedModel === defaultModel) {
      return config.default;
    }
    if (normalizedModel === fallbackModel) {
      return config.fallback;
    }
    
    // If model was requested but not matched, throw error with available options
    throw new ChatError(
      `Unsupported model: ${model}. Please use ${config.default} or ${config.fallback}`,
      provider,
      400
    );
  }

  /**
   * Creates a Claude model instance with specified configuration
   * @param modelName - Name of the Claude model to create
   * @param temperature - Optional temperature parameter for response generation
   * @returns Configured ChatAnthropic instance
   * @throws {ChatError} If API key is missing or model creation fails
   * @remarks Handles Anthropic-specific model initialization and error handling
   */
  private async createClaudeModel(modelName: string, temperature?: number) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new ChatError('Anthropic API key not configured', 'claude', 500);
    }
    try {
      const config = MODEL_CONFIGS.claude;
      const model = new ChatAnthropic({
        modelName,
        temperature: temperature ?? config.temperature,
        maxTokens: config.maxTokens,
        streaming: true,
        anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      });
      return model;
    } catch (error) {
      console.error('Claude model creation error:', {
        error,
        modelName,
        temperature
      });
      throw error;
    }
  }

  /**
   * Creates an AI model instance based on specified provider and configuration
   * @param options - Configuration options including provider, model, and temperature
   * @returns Configured model instance for the specified provider
   * @throws {ChatError} If model creation fails, provider is unsupported, or API keys are missing
   * @remarks Factory method that handles initialization for all supported providers
   */
  private async createModel(options: ChatOptions) {
    const { provider, model, temperature } = options;
    const modelName = this.getModelName(provider, model);
    const config = MODEL_CONFIGS[provider];

    try {
      switch (provider) {
        case 'gpt':
          if (!process.env.OPENAI_API_KEY) {
            throw new ChatError('OpenAI API key not configured', 'gpt', 500);
          }
          return new ChatOpenAI({
            modelName,
            temperature: temperature ?? config.temperature,
            maxTokens: config.maxTokens,
            streaming: true,
            openAIApiKey: process.env.OPENAI_API_KEY,
          });
        case 'claude':
          return await this.createClaudeModel(modelName, temperature);
        case 'gemini':
          if (!process.env.GEMINI_API_KEY) {
            throw new ChatError('Gemini API key not configured', 'gemini', 500);
          }
          return new ChatGoogleGenerativeAI({
            modelName,
            temperature: temperature ?? config.temperature,
            maxOutputTokens: config.maxTokens,
            streaming: true,
            apiKey: process.env.GEMINI_API_KEY,
          });
        default:
          throw new ChatError(`Unsupported provider: ${provider}`, provider, 400);
      }
    } catch (error) {
      console.error('Model creation error:', {
        provider,
        modelName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      if (error instanceof ChatError) throw error;
      throw new ChatError(
        `Failed to create model: ${error instanceof Error ? error.message : 'Unknown error'}`,
        provider,
        500,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Writes a chunk of streaming response to the client
   * @param res - Express Response object
   * @param content - Content chunk to send to client
   * @param messageId - Unique identifier for the message stream
   * @remarks Formats response in SSE (Server-Sent Events) format
   */
  private writeStreamResponse(res: Response, content: unknown, messageId: string) {
    const response: StreamResponse = {
      id: messageId,
      delta: { content: String(content) }
    };
    res.write(`data: ${JSON.stringify(response)}\n\n`);
  }

  /**
   * Wraps an AsyncIterable stream with a timeout mechanism
   * @param stream - Original AsyncIterable stream from the AI provider
   * @param timeoutMs - Timeout duration in milliseconds (default: 30000)
   * @returns Wrapped stream with timeout functionality
   * @throws {ChatError} If stream times out or encounters errors
   * @remarks Ensures streams don't hang indefinitely and handles timeout gracefully
   */
  private async streamWithTimeout<T>(stream: AsyncIterable<T>, timeoutMs: number = 30000): Promise<AsyncIterable<T>> {
    const timeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Stream timeout')), timeoutMs);
    });

    const iterator = stream[Symbol.asyncIterator]();
    const generator = async function* () {
      while (true) {
        try {
          const result = await Promise.race([
            iterator.next(),
            timeout
          ]) as IteratorResult<T>;
          
          if (result.done) break;
          yield result.value;
        } catch (error) {
          throw new ChatError(
            error instanceof Error ? error.message : 'Stream timeout',
            'gpt',
            504
          );
        }
      }
    };

    return generator();
  }

  /**
   * Handles streaming chat interactions with AI models
   * @param messages - Array of chat messages to process
   * @param options - Configuration options for the chat
   * @param res - Express Response object for streaming
   * @throws {ChatError} If streaming fails or encounters an error
   * @remarks
   * - Sets up SSE connection for real-time streaming
   * - Handles timeout and error scenarios
   * - Ensures proper stream cleanup
   */
  async streamChat(messages: Message[], options: ChatOptions, res: Response) {
    let streamStarted = false;
    const startTime = Date.now();
    const messageId = `${options.provider}-${Date.now()}`;

    try {
      this.validateMessages(messages);
      console.log('Creating model for:', options.provider);
      const model = await this.createModel(options);
      console.log('Converting messages');
      const langchainMessages = this.convertMessages(messages);
      console.log('Starting stream');
      const stream = await model.stream(langchainMessages);
      console.log('Adding timeout to stream');
      const timeoutStream = await this.streamWithTimeout(stream);

      for await (const chunk of timeoutStream) {
        if (chunk && typeof chunk === 'object' && 'content' in chunk) {
          streamStarted = true;
          this.writeStreamResponse(res, chunk.content, messageId);
        }
      }

      if (!streamStarted) {
        throw new ChatError(
          'No content received from model',
          options.provider,
          500
        );
      }

      res.write('data: [DONE]\n\n');
    } catch (error) {
      const chatError = error instanceof ChatError ? error : new ChatError(
        'An unexpected error occurred',
        options.provider,
        500,
        error instanceof Error ? error : undefined
      );
      
      console.error(`Error in ${options.provider} chat:`, {
        message: chatError.message,
        statusCode: chatError.statusCode,
        originalError: chatError.originalError,
        duration: Date.now() - startTime,
        streamStarted,
        stack: error instanceof Error ? error.stack : undefined
      });

      // Send error message to client
      this.writeStreamResponse(res, `Error: ${chatError.message}`, messageId);
      res.write('data: [DONE]\n\n');
    } finally {
      res.end();
    }
  }

  /**
   * Handles non-streaming chat interactions with AI models
   * @param messages - Array of chat messages to process
   * @param options - Configuration options for the chat
   * @returns Promise resolving to the complete model response
   * @throws {ChatError} If chat completion fails
   * @remarks Provides synchronous-style chat completion for simpler use cases
   */
  async chat(messages: Message[], options: ChatOptions): Promise<string> {
    try {
      this.validateMessages(messages);
      const model = await this.createModel(options);
      const langchainMessages = this.convertMessages(messages);
      const response = await model.invoke(langchainMessages);
      return String(response.content);
    } catch (error) {
      if (error instanceof ChatError) throw error;
      throw new ChatError(
        'Failed to get chat response',
        options.provider,
        500,
        error instanceof Error ? error : undefined
      );
    }
  }
}

/**
 * Singleton instance of the LangChainService
 * Use this exported instance for all chat interactions
 */
export const langchainService = new LangChainService(); 