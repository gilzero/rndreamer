/**
 * @fileoverview Message validation configuration and utility functions.
 * 
 * @filepath src/config/validation.ts
 * 
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

/** Message validation limits configuration */
type MessageLimits = {
  readonly MAX_MESSAGE_LENGTH: number;
  readonly MAX_MESSAGES_IN_CONTEXT: number;
  readonly MIN_MESSAGE_LENGTH: number;
};

export const MESSAGE_LIMITS: MessageLimits = {
  MAX_MESSAGE_LENGTH: Number(process.env['MAX_MESSAGE_LENGTH'] || 24000),
  MAX_MESSAGES_IN_CONTEXT: Number(process.env['MAX_MESSAGES_IN_CONTEXT'] || 50),
  MIN_MESSAGE_LENGTH: Number(process.env['MIN_MESSAGE_LENGTH'] || 1),
} as const;

/** Possible message validation error codes */
type ValidationErrorCode =
  | 'EMPTY_MESSAGE'
  | 'MESSAGE_TOO_LONG'
  | 'TOO_MANY_MESSAGES'
  | 'INVALID_ROLE';

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
  code: ValidationErrorCode;
}

/** Chat message structure */
interface ChatMessage {
  role: string;
  content: string;
}

/**
 * Validates a single chat message.
 * Checks content length and role validity.
 *
 * @param {ChatMessage} message - The message object to validate.
 * @returns {MessageValidationError | null} Validation error or null if valid.
 */
export function validateMessage(message: ChatMessage): MessageValidationError | null {
  const { content, role } = message;

  if (!content.trim()) {
    return { message: 'Message content cannot be empty', code: 'EMPTY_MESSAGE' };
  }

  if (content.length > MESSAGE_LIMITS.MAX_MESSAGE_LENGTH) {
    return {
      message: `Message exceeds maximum length of ${MESSAGE_LIMITS.MAX_MESSAGE_LENGTH} characters`,
      code: 'MESSAGE_TOO_LONG',
    };
  }

    // Using a switch statement (or a Set) is generally more efficient than includes() for multiple value checks
  switch (role) {
    case 'user':
    case 'assistant':
    case 'system':
      break; // Valid roles
    default:
      return { message: 'Invalid message role', code: 'INVALID_ROLE' };
  }

  return null;
}
/**
 * Validates an array of chat messages for a conversation.
 * Checks both individual message validity and conversation-level constraints.
 *
 * @param {ChatMessage[]} messages - Array of message objects to validate.
 * @returns {MessageValidationError | null} First validation error, or null if valid.
 */
export function validateMessages(messages: ChatMessage[]): MessageValidationError | null {
  if (messages.length > MESSAGE_LIMITS.MAX_MESSAGES_IN_CONTEXT) {
    return {
      message: `Conversation exceeds maximum of ${MESSAGE_LIMITS.MAX_MESSAGES_IN_CONTEXT} messages`,
      code: 'TOO_MANY_MESSAGES',
    };
  }

  // Return the first validation error found
  for (const message of messages) {
    const error = validateMessage(message);
    if (error) return error;
  }
  return null;
}