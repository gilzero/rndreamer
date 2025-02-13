// @file-overview: chat service for the app
// @file-path: app/src/services/chatService.ts
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatMessage, ModelProvider } from "../../types";

export interface ChatOptions {
  provider: ModelProvider;
  model: string;
  temperature?: number;
  streaming?: boolean;
}

export interface ChatCallbacks {
  onToken: (token: string) => void;
  onError: (error: Error) => void;
  onComplete: () => void;
}

class ChatService {
  private modelInstances: Map<string, ChatOpenAI | ChatAnthropic | ChatGoogleGenerativeAI> = new Map();

  private createModel(options: ChatOptions) {
    const { provider, model, temperature = 0.7, streaming = true } = options;

    try {
      switch (provider) {
        case "gpt":
          return new ChatOpenAI({
            modelName: model,
            temperature,
            streaming,
          });
        case "claude":
          return new ChatAnthropic({
            modelName: model,
            temperature,
            streaming,
          });
        case "gemini":
          return new ChatGoogleGenerativeAI({
            modelName: model,
            temperature,
            streaming,
          });
        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error: unknown) {
      throw new Error(`Failed to create model: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getModel(options: ChatOptions) {
    const key = `${options.provider}-${options.model}`;
    if (!this.modelInstances.has(key)) {
      this.modelInstances.set(key, this.createModel(options));
    }
    return this.modelInstances.get(key)!;
  }

  private convertToLangChainMessages(messages: ChatMessage[]) {
    return messages.map(msg => {
      switch (msg.role) {
        case 'user':
          return new HumanMessage(msg.content);
        case 'assistant':
          return new AIMessage(msg.content);
        case 'system':
          return new SystemMessage(msg.content);
        default:
          throw new Error(`Unsupported message role: ${msg.role}`);
      }
    });
  }

  async streamChat(
    messages: ChatMessage[],
    options: ChatOptions,
    callbacks: ChatCallbacks
  ) {
    const { onToken, onError, onComplete } = callbacks;

    try {
      const model = this.getModel(options);
      const chain = RunnableSequence.from([
        {
          input: (messages: ChatMessage[]) => this.convertToLangChainMessages(messages),
        },
        model,
        new StringOutputParser(),
      ]);

      const stream = await chain.stream(messages);

      for await (const chunk of stream) {
        onToken(chunk);
      }
      
      onComplete();
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Unknown error occurred'));
    }
  }

  async chat(messages: ChatMessage[], options: ChatOptions): Promise<string> {
    try {
      const model = this.getModel(options);
      const chain = RunnableSequence.from([
        {
          input: (messages: ChatMessage[]) => this.convertToLangChainMessages(messages),
        },
        model,
        new StringOutputParser(),
      ]);

      return await chain.invoke(messages);
    } catch (error) {
      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  }
}

export const chatService = new ChatService(); 