// @file-overview: chat service for the app
// @file-path: app/src/services/chatService.ts
import { ChatMessage, ModelProvider } from "../../types";
import { DOMAIN } from "../../constants";
import EventSource from 'react-native-sse';

export class ChatError extends Error {
  code: string;
  
  constructor(message: string, code: string = 'UNKNOWN_ERROR') {
    super(message);
    this.code = code;
    this.name = 'ChatError';
  }
}

export interface ChatOptions {
  provider: ModelProvider;
  model: string;
  temperature?: number;
  streaming?: boolean;
}

export interface ChatCallbacks {
  onToken: (token: string, messageId: string) => void;
  onError: (error: Error) => void;
  onComplete: () => void;
}

class ChatService {
  private getApiUrl() {
    return DOMAIN;
  }

  async streamChat(
    messages: ChatMessage[],
    options: ChatOptions,
    callbacks: ChatCallbacks
  ) {
    const { onToken, onError, onComplete } = callbacks;
    const { provider, model } = options;

    try {
      const es = new EventSource(`${this.getApiUrl()}/chat/${provider}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify({
          messages,
          model
        }),
      });

      es.addEventListener('message', (event) => {
        if (!event.data) return;
        if (event.data === '[DONE]') {
          es.close();
          onComplete();
          return;
        }
        try {
          const parsed = JSON.parse(event.data);
          const content = parsed.delta?.content || '';
          const messageId = parsed.id;
          if (content && messageId) {
            onToken(content, messageId);
          }
        } catch (e) {
          console.warn('Failed to parse chunk:', e);
          onError(new ChatError('Failed to parse response from server', 'PARSE_ERROR'));
        }
      });

      es.addEventListener('error', (error) => {
        es.close();
        if (error instanceof Error) {
          onError(new ChatError(error.message, 'STREAM_ERROR'));
        } else {
          onError(new ChatError('Stream error occurred', 'STREAM_ERROR'));
        }
      });
    } catch (error) {
      if (error instanceof Error) {
        onError(new ChatError(error.message, 'REQUEST_ERROR'));
      } else {
        onError(new ChatError('Failed to connect to chat service', 'REQUEST_ERROR'));
      }
    }
  }

  async chat(messages: ChatMessage[], options: ChatOptions): Promise<string> {
    try {
      const { provider, model } = options;
      const response = await fetch(`${this.getApiUrl()}/chat/${provider}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          model
        })
      });

      if (!response.ok) {
        throw new ChatError(
          `Server responded with status: ${response.status}`,
          'HTTP_ERROR'
        );
      }

      const data = await response.json();
      return data.content || '';
    } catch (error) {
      if (error instanceof ChatError) {
        throw error;
      } else if (error instanceof Error) {
        throw new ChatError(error.message, 'REQUEST_ERROR');
      } else {
        throw new ChatError('Unknown error occurred', 'UNKNOWN_ERROR');
      }
    }
  }
}

export const chatService = new ChatService(); 