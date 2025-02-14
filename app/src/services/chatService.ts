// @file-overview: chat service for the app
// @file-path: app/src/services/chatService.ts
import { ChatMessage, ModelProvider } from "../../types";
import { DOMAIN } from "../../constants";
import EventSource from 'react-native-sse';

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
        }
      });

      es.addEventListener('error', (error) => {
        es.close();
        onError(error instanceof Error ? error : new Error('Stream error occurred'));
      });
    } catch (error) {
      onError(error instanceof Error ? error : new Error('Unknown error occurred'));
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.content || '';
    } catch (error) {
      throw error instanceof Error ? error : new Error('Unknown error occurred');
    }
  }
}

export const chatService = new ChatService(); 