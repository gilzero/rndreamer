// @fileoverview: chat service for the app
// @filepath: app/src/services/chatService.ts

/**
 * DEV NOTE: Chat Implementation Strategy
 * 
 * Currently, the app exclusively uses streaming for all chat interactions via streamChat().
 * The non-streaming chat() method is kept as a placeholder for potential future use cases,
 * but should only be implemented if specific non-streaming requirements arise.
 * 
 * We intentionally default to and reinforce the streaming approach as it provides:
 * - Better user experience with real-time responses
 * - More interactive feedback
 * - Smoother UI updates
 */
import { ChatMessage, ModelProvider } from "../../types";
import { DOMAIN } from "../../constants";
import EventSource from 'react-native-sse';
import { createSSEConnection } from '../utils/sseUtils';
import { ChatError } from '../utils/errorUtils';

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

const STREAM_TIMEOUT = 60000; // 1 minute timeout for entire stream

class ChatService {
  private getApiUrl() {
    return DOMAIN;
  }

  async streamChat( // Streaming method - primarily used (default)
    messages: ChatMessage[],
    options: ChatOptions,
    callbacks: ChatCallbacks
  ) {
    const { onToken, onError, onComplete } = callbacks;
    const { provider, model } = options;
    const url = `${this.getApiUrl()}/chat/${provider}`;
    const body = JSON.stringify({ messages, model });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new ChatError('Stream timeout', 'STREAM_TIMEOUT'));
      }, STREAM_TIMEOUT);
    });

    try {
      const es = await Promise.race([
        createSSEConnection(url, body, callbacks),
        timeoutPromise
      ]) as EventSource;
      
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

  // Non-streaming method - appears to be mainly used for health checks
  async chat(messages: ChatMessage[], options: ChatOptions): Promise<string> {
    try {
      const { provider, model } = options;
      const response = await fetch(`${this.getApiUrl()}/chat/${provider}`, {
        // Regular REST API call
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