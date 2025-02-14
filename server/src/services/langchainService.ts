import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { BaseMessage, AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Response } from 'express';

type ModelProvider = 'gpt' | 'claude' | 'gemini';
type Message = { role: 'user' | 'assistant' | 'system'; content: string };

type ModelConfig = {
  default: string;
  models: Record<string, string>;
};

type ModelConfigs = {
  [K in ModelProvider]: ModelConfig;
};

interface ChatOptions {
  provider: ModelProvider;
  model: string;
  temperature?: number;
}

interface StreamResponse {
  id: string;
  delta: {
    content: string;
  };
}

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

const MODEL_CONFIGS: ModelConfigs = {
  gpt: {
    default: 'gpt-4o',
    models: {
      'gpt-4o': 'gpt-4o',
      'gpt-4o-mini': 'gpt-4o-mini',
    }
  },
  claude: {
    default: 'claude-3-5-sonnet',
    models: {
      'claude-3-5-sonnet': 'claude-3-5-sonnet-latest',
      'claude-3-5-haiku': 'claude-3-5-haiku-latest',
    }
  },
  gemini: {
    default: 'gemini-2.0-flash',
    models: {
      'gemini-2.0-flash': 'gemini-2.0-flash',
    }
  }
};

export class LangChainService {
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

  private getModelName(provider: ModelProvider, model: string): string {
    const config = MODEL_CONFIGS[provider];
    const modelName = config.models[model] || config.models[config.default];
    if (!modelName) {
      throw new ChatError(`Unsupported model: ${model}`, provider, 400);
    }
    return modelName;
  }

  private async createClaudeModel(modelName: string, temperature: number) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new ChatError('Anthropic API key not configured', 'claude', 500);
    }
    try {
      const model = new ChatAnthropic({
        modelName,
        temperature,
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

  private async createModel(options: ChatOptions) {
    const { provider, model, temperature = 0.7 } = options;
    const modelName = this.getModelName(provider, model);

    try {
      switch (provider) {
        case 'gpt':
          if (!process.env.OPENAI_API_KEY) {
            throw new ChatError('OpenAI API key not configured', 'gpt', 500);
          }
          return new ChatOpenAI({
            modelName,
            temperature,
            streaming: true,
            openAIApiKey: process.env.OPENAI_API_KEY,
          });
        case 'claude':
          return await this.createClaudeModel(modelName, temperature);
        case 'gemini':
          if (!process.env.GOOGLE_API_KEY) {
            throw new ChatError('Google API key not configured', 'gemini', 500);
          }
          return new ChatGoogleGenerativeAI({
            modelName,
            temperature,
            streaming: true,
            apiKey: process.env.GOOGLE_API_KEY,
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

  private writeStreamResponse(res: Response, content: unknown, messageId: string) {
    const response: StreamResponse = {
      id: messageId,
      delta: { content: String(content) }
    };
    res.write(`data: ${JSON.stringify(response)}\n\n`);
  }

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

export const langchainService = new LangChainService(); 