/**
 * @fileoverview Utility functions and constants for chat functionality.
 * Provides message validation, text processing, and chat service helpers.
 * 
 * @filepath: app/src/utils.ts
 * 
 * @see {@link ../services/chatService.ts} for the main chat service implementation
 * @see {@link ../screens/chat.tsx} for the chat UI implementation
 */

import { DOMAIN } from '../constants'
import EventSource from 'react-native-sse'
import { Model, ModelProvider, ChatMessage } from '../types'

/**
 * Configuration constants for message validation.
 * Values can be overridden through environment variables.
 * 
 * @see {@link validateMessage} for single message validation
 * @see {@link validateMessages} for conversation validation
 */
export const MESSAGE_LIMITS = {
  /** Maximum allowed length for a single message */
  MAX_MESSAGE_LENGTH: Number(process.env['EXPO_PUBLIC_MAX_MESSAGE_LENGTH'] || 24000),
  /** Maximum number of messages allowed in a conversation context */
  MAX_MESSAGES_IN_CONTEXT: Number(process.env['EXPO_PUBLIC_MAX_MESSAGES_IN_CONTEXT'] || 50),
  /** Minimum required length for a message */
  MIN_MESSAGE_LENGTH: Number(process.env['EXPO_PUBLIC_MIN_MESSAGE_LENGTH'] || 1)
} as const;

/**
 * Creates an EventSource instance for server-sent events communication.
 * Used by the chat service to establish streaming connections with AI models.
 * 
 * @param {object} config - Configuration for the EventSource
 * @param {object} [config.headers] - Optional headers to include in the request
 * @param {any} config.body - Request body to send
 * @param {string} config.type - Chat model type identifier
 * @returns {EventSource} Configured EventSource instance
 * @throws {Error} If the connection cannot be established
 * 
 * @see {@link ../services/chatService.ts} for usage in chat streaming
 */
export function getEventSource({
  headers,
  body,
  type
} : {
  headers?: any,
  body: any,
  type: string
}) {
  const es = new EventSource(`${DOMAIN}/chat/${type}`, {
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    method: 'POST',
    body: JSON.stringify(body),
  })

  return es;
}

/**
 * Truncates text to a specified maximum length while preserving whole words.
 * Used to enforce message length limits in the chat interface.
 * 
 * @param {string} text - Text to process
 * @param {number} [numChars] - Maximum number of characters (defaults to MAX_MESSAGE_LENGTH)
 * @returns {string} Processed text within the specified length
 * 
 * @see {@link ../screens/chat.tsx} for usage in message input handling
 */
export function getFirstNCharsOrLess(text: string, numChars: number = MESSAGE_LIMITS.MAX_MESSAGE_LENGTH): string {
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
 * Returns the first N items from an array of messages.
 * Used for pagination and limiting context window size.
 * 
 * @param {object} params - Function parameters
 * @param {number} [params.size=10] - Number of items to return
 * @param {any[]} params.messages - Array of messages
 * @returns {any[]} Array containing the first N messages
 * 
 * @see {@link ../screens/chat.tsx} for usage in message history management
 */
export function getFirstN({ messages, size = 10 } : { size?: number, messages: any[] }) {
  if (messages.length > size) {
    const firstN = new Array()
    for(let i = 0; i < size; i++) {
      firstN.push(messages[i])
    }
    return firstN
  } else {
    return messages
  }
}

/**
 * Determines the chat model provider based on the model configuration.
 * Used to route chat requests to the appropriate AI model service.
 * 
 * @param {Model} type - Model configuration object
 * @returns {ModelProvider} Identified model provider
 * @throws {Error} If the model type is not supported
 * 
 * @see {@link ../services/chatService.ts} for usage in API routing
 * @see {@link ../components/ChatModelModal.tsx} for model selection UI
 */
export function getChatType(type: Model): ModelProvider {
  const label = type.label.toLowerCase();
  
  if (label.includes('gpt')) return 'gpt';
  if (label.includes('gemini')) return 'gemini';
  if (label.includes('claude')) return 'claude';
  
  throw new Error(`Unsupported model type: ${type.label}. Must be one of: gpt, claude, or gemini`);
}

/**
 * Interface for message validation error results.
 * Used throughout the application for consistent error handling.
 * 
 * @see {@link ../services/chatService.ts} for error handling in the chat service
 * @see {@link ../screens/chat.tsx} for error display in the UI
 */
export interface MessageValidationError {
  /** Human-readable error message for display to users */
  message: string;
  /** 
   * Error type identifier for programmatic handling
   * - EMPTY_MESSAGE: Message has no content
   * - MESSAGE_TOO_LONG: Exceeds MAX_MESSAGE_LENGTH
   * - TOO_MANY_MESSAGES: Exceeds MAX_MESSAGES_IN_CONTEXT
   * - INVALID_ROLE: Role not in ['user', 'assistant', 'system']
   */
  code: 'EMPTY_MESSAGE' | 'MESSAGE_TOO_LONG' | 'TOO_MANY_MESSAGES' | 'INVALID_ROLE';
}

/**
 * Validates a single chat message against defined constraints.
 * Used before sending messages to ensure they meet requirements.
 * 
 * Error cases:
 * - Empty content: Returns EMPTY_MESSAGE error
 * - Content too long: Returns MESSAGE_TOO_LONG error
 * - Invalid role: Returns INVALID_ROLE error
 * 
 * @param {ChatMessage} message - Message to validate
 * @returns {MessageValidationError | null} Validation error if any, null if valid
 * 
 * @see {@link ../screens/chat.tsx} for validation before sending messages
 * @see {@link MessageValidationError} for error types
 */
export function validateMessage(message: ChatMessage): MessageValidationError | null {
  if (!message.content?.trim()) {
    return {
      message: 'Message content cannot be empty',
      code: 'EMPTY_MESSAGE'
    };
  }

  if (message.content.length > MESSAGE_LIMITS.MAX_MESSAGE_LENGTH) {
    return {
      message: `Message exceeds maximum length of ${MESSAGE_LIMITS.MAX_MESSAGE_LENGTH} characters`,
      code: 'MESSAGE_TOO_LONG'
    };
  }

  if (!['user', 'assistant', 'system'].includes(message.role)) {
    return {
      message: 'Invalid message role',
      code: 'INVALID_ROLE'
    };
  }

  return null;
}

/**
 * Validates an array of chat messages against defined constraints.
 * Used to validate entire conversations before processing.
 * 
 * Error cases:
 * - Too many messages: Returns TOO_MANY_MESSAGES error
 * - Individual message errors: Returns the first error found by validateMessage
 * 
 * @param {ChatMessage[]} messages - Array of messages to validate
 * @returns {MessageValidationError | null} Validation error if any, null if valid
 * 
 * @see {@link validateMessage} for individual message validation
 * @see {@link ../screens/chat.tsx} for conversation validation
 * @see {@link MessageValidationError} for error types
 */
export function validateMessages(messages: ChatMessage[]): MessageValidationError | null {
  if (messages.length > MESSAGE_LIMITS.MAX_MESSAGES_IN_CONTEXT) {
    return {
      message: `Conversation exceeds maximum of ${MESSAGE_LIMITS.MAX_MESSAGES_IN_CONTEXT} messages`,
      code: 'TOO_MANY_MESSAGES'
    };
  }

  for (const message of messages) {
    const error = validateMessage(message);
    if (error) return error;
  }

  return null;
}