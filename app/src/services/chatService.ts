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
  onConnectionStatus?: (status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting') => void;
}

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

class ChatService {
  private getApiUrl() {
    return DOMAIN;
  }

  private async attemptConnection(
    url: string,
    body: string,
    callbacks: ChatCallbacks,
    retryCount: number = 0
  ): Promise<EventSource> {
    const { onToken, onError, onComplete, onConnectionStatus } = callbacks;

    try {
      if (onConnectionStatus) {
        onConnectionStatus(retryCount === 0 ? 'connecting' : 'reconnecting');
      }

      const es = new EventSource(url, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body,
      });

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          es.close();
          reject(new ChatError('Connection timeout', 'CONNECTION_TIMEOUT'));
        }, 10000); // 10 second timeout

        es.addEventListener('open', () => {
          clearTimeout(timeout);
          if (onConnectionStatus) {
            onConnectionStatus('connected');
          }
          resolve(es);
        });

        es.addEventListener('error', async (error) => {
          clearTimeout(timeout);
          es.close();
          
          if (retryCount < MAX_RETRIES) {
            const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
            if (onConnectionStatus) {
              onConnectionStatus('reconnecting');
            }
            
            try {
              await new Promise(resolve => setTimeout(resolve, delay));
              const newEs = await this.attemptConnection(url, body, callbacks, retryCount + 1);
              resolve(newEs);
            } catch (retryError) {
              reject(retryError);
            }
          } else {
            if (onConnectionStatus) {
              onConnectionStatus('disconnected');
            }
            reject(new ChatError('Max retry attempts reached', 'MAX_RETRIES_EXCEEDED'));
          }
        });
      });
    } catch (error) {
      if (error instanceof ChatError) {
        throw error;
      }
      throw new ChatError('Failed to establish connection', 'CONNECTION_ERROR');
    }
  }

  async streamChat(
    messages: ChatMessage[],
    options: ChatOptions,
    callbacks: ChatCallbacks
  ) {
    const { onToken, onError, onComplete } = callbacks;
    const { provider, model } = options;
    const url = `${this.getApiUrl()}/chat/${provider}`;
    const body = JSON.stringify({ messages, model });

    try {
      const es = await this.attemptConnection(url, body, callbacks);
      let isCompletedNormally = false;

      es.addEventListener('message', (event) => {
        if (!event.data) return;
        if (event.data === '[DONE]') {
          isCompletedNormally = true;
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

      // Handle unexpected connection close
      es.addEventListener('close', () => {
        // Only notify disconnection if the stream didn't complete normally
        if (!isCompletedNormally && callbacks.onConnectionStatus) {
          callbacks.onConnectionStatus('disconnected');
        }
      });

    } catch (error) {
      if (error instanceof ChatError) {
        onError(error);
      } else if (error instanceof Error) {
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