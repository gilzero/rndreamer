/**
 * @fileoverview Message validation configuration and utility functions.
 * Provides constants and functions for validating chat message format and content.
 * 
 * This module handles:
 * - Message length validation
 * - Message role validation
 * - Conversation size limits
 * - Error message generation
 * 
 * @module validation
 * 
 * @example
 * import { validateMessage, validateMessages } from './config/validation';
 * 
 * // Validate a single message
 * const error = validateMessage({
 *   role: 'user',
 *   content: 'Hello, AI!'
 * });
 * 
 * // Validate entire conversation
 * const errors = validateMessages([
 *   { role: 'user', content: 'Hi' },
 *   { role: 'assistant', content: 'Hello!' }
 * ]);
 */

/**
 * Configuration constants for message validation.
 * All values can be overridden through environment variables.
 * 
 * @constant
 * @type {Readonly<{
 *   MAX_MESSAGE_LENGTH: number,
 *   MAX_MESSAGES_IN_CONTEXT: number,
 *   MIN_MESSAGE_LENGTH: number
 * }>}
 * 
 * @property {number} MAX_MESSAGE_LENGTH - Maximum characters per message (default: 24000)
 * @property {number} MAX_MESSAGES_IN_CONTEXT - Maximum messages in conversation (default: 50)
 * @property {number} MIN_MESSAGE_LENGTH - Minimum characters per message (default: 1)
 */
export const MESSAGE_LIMITS = {
  MAX_MESSAGE_LENGTH: Number(process.env['MAX_MESSAGE_LENGTH'] || 24000),
  MAX_MESSAGES_IN_CONTEXT: Number(process.env['MAX_MESSAGES_IN_CONTEXT'] || 50),
  MIN_MESSAGE_LENGTH: Number(process.env['MIN_MESSAGE_LENGTH'] || 1)
} as const;

/**
 * Interface defining the structure of message validation errors.
 * Used for consistent error reporting across the application.
 * 
 * @interface MessageValidationError
 * @property {string} message - Human-readable error description
 * @property {string} code - Machine-readable error identifier
 * 
 * Error Codes:
 * - EMPTY_MESSAGE: Message content is empty or whitespace
 * - MESSAGE_TOO_LONG: Exceeds MAX_MESSAGE_LENGTH
 * - TOO_MANY_MESSAGES: Exceeds MAX_MESSAGES_IN_CONTEXT
 * - INVALID_ROLE: Role not in ['user', 'assistant', 'system']
 */
export interface MessageValidationError {
  /** Error message describing the validation failure */
  message: string;
  /** Error code identifying the type of validation failure */
  code: 'EMPTY_MESSAGE' | 'MESSAGE_TOO_LONG' | 'TOO_MANY_MESSAGES' | 'INVALID_ROLE';
}

/**
 * Validates a single chat message against defined constraints.
 * Checks content length and role validity.
 * 
 * @param {object} message - The message object to validate
 * @param {string} message.role - Message sender role (user/assistant/system)
 * @param {string} message.content - Message content text
 * @returns {MessageValidationError | null} Validation error if any, null if valid
 * 
 * @example
 * const error = validateMessage({
 *   role: 'user',
 *   content: 'Hello, AI!'
 * });
 * 
 * if (error) {
 *   console.error(`Validation failed: ${error.message}`);
 * }
 */
export function validateMessage(message: { role: string; content: string }): MessageValidationError | null {
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
 * Validates an array of chat messages for a conversation.
 * Checks both individual message validity and conversation-level constraints.
 * 
 * @param {Array<object>} messages - Array of message objects to validate
 * @param {string} messages[].role - Message sender role
 * @param {string} messages[].content - Message content text
 * @returns {MessageValidationError | null} First validation error found, null if all valid
 * 
 * @example
 * const conversation = [
 *   { role: 'system', content: 'You are a helpful assistant.' },
 *   { role: 'user', content: 'Hello!' },
 *   { role: 'assistant', content: 'Hi there! How can I help?' }
 * ];
 * 
 * const error = validateMessages(conversation);
 * if (error) {
 *   console.error(`Conversation validation failed: ${error.message}`);
 * }
 */
export function validateMessages(messages: Array<{ role: string; content: string }>): MessageValidationError | null {
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