/**
 * @fileoverview Message validation configuration and utility functions.
 * Provides constants and functions for validating chat message format and content.
 * 
 * @module validation
 */

/**
 * Configuration constants for message validation.
 * Values are loaded from environment variables with fallbacks.
 * @constant
 */
export const MESSAGE_LIMITS = {
  MAX_MESSAGE_LENGTH: Number(process.env.MAX_MESSAGE_LENGTH || 24000),
  MAX_MESSAGES_IN_CONTEXT: Number(process.env.MAX_MESSAGES_IN_CONTEXT || 50),
  MIN_MESSAGE_LENGTH: Number(process.env.MIN_MESSAGE_LENGTH || 1)
} as const;

/**
 * Interface defining the structure of message validation errors.
 * @interface MessageValidationError
 */
export interface MessageValidationError {
  /** Error message describing the validation failure */
  message: string;
  /** Error code identifying the type of validation failure */
  code: 'EMPTY_MESSAGE' | 'MESSAGE_TOO_LONG' | 'TOO_MANY_MESSAGES' | 'INVALID_ROLE';
}

/**
 * Validates a single chat message.
 * @param message - The message object to validate
 * @returns MessageValidationError if validation fails, null if message is valid
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
 * Validates an array of chat messages.
 * Checks both individual message validity and overall conversation constraints.
 * @param messages - Array of message objects to validate
 * @returns MessageValidationError if validation fails, null if all messages are valid
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