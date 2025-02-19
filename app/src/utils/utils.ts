/**
 * @fileoverview Core utility functions for chat message handling, validation, and SSE connections.
 * This module provides essential functionality for managing chat messages, establishing SSE
 * connections, and handling different model providers in the chat application.
 * 
 * @filepath app/src/utils/utils.ts
 */

import { ChatMessage, Model, ModelProvider, DOMAIN, APP_CONFIG } from '../config';
import EventSource from 'react-native-sse';

// =============== Error Handling ===============

/**
 * Custom error class for chat-related errors with specific error codes.
 * Used to provide more detailed error information throughout the application.
 */
export class ChatError extends Error {
  code: string;
  
  constructor(message: string, code: string = 'UNKNOWN_ERROR') {
    super(message);
    this.code = code;
    this.name = 'ChatError';
  }
}

// =============== Message Utilities ===============

/**
 * Truncates text to specified character limit while preserving content integrity.
 * 
 * @param text - The input text to be processed
 * @param numChars - Maximum number of characters to return (defaults to MAX_MESSAGE_LENGTH)
 * @returns Trimmed and truncated string, or empty string if input is invalid
 */
export function getFirstNCharsOrLess(text: string, numChars: number = APP_CONFIG.VALIDATION.MESSAGES.MAX_LENGTH): string {
  if (!text?.trim()) {
    return '';
  }
  const trimmedText = text.trim();
  if (trimmedText.length <= numChars) {
    return trimmedText;
  }
  return trimmedText.substring(0, numChars);
}

/**
 * Retrieves the first N elements from a message array.
 * 
 * @param options - Configuration object
 * @param options.messages - Array of messages to process
 * @param options.size - Number of messages to return (default: 10)
 * @returns Array containing the first N messages
 */
export function getFirstN({ messages, size = 10 } : { size?: number, messages: any[] }) {
  if (messages.length > size) {
    const firstN = new Array();
    for(let i = 0; i < size; i++) {
      firstN.push(messages[i]);
    }
    return firstN;
  } else {
    return messages;
  }
}

// =============== Message Validation ===============

/**
 * Represents possible message validation error types.
 */
export interface MessageValidationError {
  message: string;
  code: 'EMPTY_MESSAGE' | 'MESSAGE_TOO_LONG' | 'TOO_MANY_MESSAGES' | 'INVALID_ROLE';
}

/**
 * Custom error class for message validation failures.
 */
export class ChatValidationError extends Error {
  constructor(
    public code: MessageValidationError['code'],
    message: string
  ) {
    super(message);
    this.name = 'ChatValidationError';
  }
}

/**
 * Validates a single chat message against defined constraints.
 * 
 * @param message - The chat message to validate
 * @throws {ChatValidationError} If message fails validation
 */
export function validateMessage(message: ChatMessage): void {
  const content = message.content?.trim();
  
  if (!content) {
    throw new ChatValidationError('EMPTY_MESSAGE', APP_CONFIG.ERRORS.VALIDATION.EMPTY_MESSAGE);
  }

  if (content.length > APP_CONFIG.VALIDATION.MESSAGES.MAX_LENGTH) {
    throw new ChatValidationError(
      'MESSAGE_TOO_LONG',
      APP_CONFIG.ERRORS.VALIDATION.MESSAGE_TOO_LONG(APP_CONFIG.VALIDATION.MESSAGES.MAX_LENGTH)
    );
  }
}

/**
 * Validates an array of chat messages against defined constraints.
 * 
 * @param messages - Array of chat messages to validate
 * @returns MessageValidationError if validation fails, null if validation passes
 */
export function validateMessages(messages: ChatMessage[]): MessageValidationError | null {
  if (messages.length > APP_CONFIG.VALIDATION.MESSAGES.MAX_HISTORY) {
    return {
      code: 'TOO_MANY_MESSAGES',
      message: APP_CONFIG.ERRORS.VALIDATION.TOO_MANY_MESSAGES(APP_CONFIG.VALIDATION.MESSAGES.MAX_HISTORY)
    };
  }
  
  for (const message of messages) {
    try {
      validateMessage(message);
    } catch (error) {
      if (error instanceof ChatValidationError) {
        return { code: error.code, message: error.message };
      }
      throw error;
    }
  }
  
  return null;
}

// =============== Model Provider Utilities ===============

/**
 * Mapping of model keywords to their respective providers.
 */
const MODEL_PROVIDER_MAP: Record<string, ModelProvider> = {
  'gpt': 'gpt',
  'gemini': 'gemini',
  'claude': 'claude'
} as const;

/**
 * Determines the chat provider type based on the model label.
 * 
 * @param type - Model configuration object
 * @returns The determined model provider
 * @throws Error if the model type is not supported
 */
export function getChatType(type: Model): ModelProvider {
  const label = type.label.toLowerCase();
  
  for (const [keyword, provider] of Object.entries(MODEL_PROVIDER_MAP)) {
    if (label.includes(keyword)) return provider;
  }
  
  const supportedModels = Object.keys(MODEL_PROVIDER_MAP);
  throw new Error(APP_CONFIG.ERRORS.CONNECTION.INVALID_MODEL(type.label, supportedModels));
}

// =============== SSE Connection Handling ===============

/**
 * Callback interface for SSE connection status updates.
 */
export interface SSEConnectionCallbacks {
  onConnectionStatus?: (status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting') => void;
}

const { MAX_ATTEMPTS, BACKOFF_MS, MAX_BACKOFF_MS } = APP_CONFIG.NETWORK.RETRY;

/**
 * Creates and manages an SSE connection with automatic retry functionality.
 * 
 * @param url - The SSE endpoint URL
 * @param body - Request body to send with the connection
 * @param callbacks - Connection status callback functions
 * @param retryCount - Current retry attempt number (used internally)
 * @returns Promise resolving to an EventSource instance
 * @throws {ChatError} If connection fails after maximum retries
 */
export async function createSSEConnection(
  url: string,
  body: string,
  callbacks: SSEConnectionCallbacks,
  retryCount: number = 0
): Promise<EventSource> {
  const { onConnectionStatus } = callbacks;

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
        reject(new ChatError(APP_CONFIG.ERRORS.CONNECTION.TIMEOUT, 'CONNECTION_TIMEOUT'));
      }, APP_CONFIG.NETWORK.TIMEOUTS.CONNECTION);

      es.addEventListener('open', () => {
        clearTimeout(timeout);
        if (onConnectionStatus) {
          onConnectionStatus('connected');
        }
        resolve(es);
      });

      es.addEventListener('error', async () => {
        clearTimeout(timeout);
        es.close();
        
        if (retryCount < MAX_ATTEMPTS) {
          // Calculate retry delay with exponential backoff, capped at MAX_BACKOFF_MS
          const retryDelay = Math.min(
            BACKOFF_MS * Math.pow(2, retryCount),
            MAX_BACKOFF_MS
          );
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          
          try {
            const newConnection = await createSSEConnection(url, body, callbacks, retryCount + 1);
            resolve(newConnection);
          } catch (error) {
            reject(error);
          }
        } else {
          if (onConnectionStatus) {
            onConnectionStatus('disconnected');
          }
          reject(new ChatError(APP_CONFIG.ERRORS.CONNECTION.FAILED, 'CONNECTION_FAILED'));
        }
      });
    });
  } catch (error) {
    if (onConnectionStatus) {
      onConnectionStatus('disconnected');
    }
    throw error;
  }
}

/**
 * Creates an EventSource instance with specified configuration.
 * 
 * @param options - Configuration options for the EventSource
 * @param options.headers - Optional additional headers
 * @param options.body - Request body
 * @param options.type - API endpoint type
 * @returns Configured EventSource instance
 */
export function getEventSource({
  headers,
  body,
  type
}: {
  headers?: Record<string, string>,
  body: unknown,
  type: string
}): EventSource {
  const url = `${DOMAIN}/api/${type}`;
  const stringifiedBody = JSON.stringify(body);
  
  return new EventSource(url, {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    method: 'POST',
    body: stringifiedBody,
  });
}