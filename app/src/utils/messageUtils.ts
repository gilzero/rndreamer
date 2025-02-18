import { ChatMessage } from '../../types';

/**
 * Configuration constants for message validation.
 * Values can be overridden through environment variables.
 */
export const MESSAGE_LIMITS = {
  /** Maximum allowed length for a single message */
  MAX_MESSAGE_LENGTH: Number(process.env['EXPO_PUBLIC_MAX_MESSAGE_LENGTH'] || 24000),
  /** Maximum number of messages allowed in a conversation context */
  MAX_MESSAGES_IN_CONTEXT: Number(process.env['EXPO_PUBLIC_MAX_MESSAGES_IN_CONTEXT'] || 50),
  /** Minimum required length for a message */
  MIN_MESSAGE_LENGTH: Number(process.env['EXPO_PUBLIC_MIN_MESSAGE_LENGTH'] || 1)
} as const;

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

export interface MessageValidationError {
  message: string;
  code: 'EMPTY_MESSAGE' | 'MESSAGE_TOO_LONG' | 'TOO_MANY_MESSAGES' | 'INVALID_ROLE';
}

export class ChatValidationError extends Error {
  constructor(
    public code: MessageValidationError['code'],
    message: string
  ) {
    super(message);
    this.name = 'ChatValidationError';
  }
}

export function validateMessage(message: ChatMessage): void {
  if (!message.content?.trim()) {
    throw new ChatValidationError(
      'EMPTY_MESSAGE',
      'Message content cannot be empty'
    );
  }

  if (message.content.length > MESSAGE_LIMITS.MAX_MESSAGE_LENGTH) {
    throw new ChatValidationError(
      'MESSAGE_TOO_LONG',
      `Message exceeds maximum length of ${MESSAGE_LIMITS.MAX_MESSAGE_LENGTH} characters`
    );
  }

  if (!['user', 'assistant', 'system'].includes(message.role)) {
    throw new ChatValidationError(
      'INVALID_ROLE',
      'Invalid message role'
    );
  }
}

export function validateMessages(messages: ChatMessage[]): MessageValidationError | null {
  if (messages.length > MESSAGE_LIMITS.MAX_MESSAGES_IN_CONTEXT) {
    return {
      message: `Conversation exceeds maximum of ${MESSAGE_LIMITS.MAX_MESSAGES_IN_CONTEXT} messages`,
      code: 'TOO_MANY_MESSAGES'
    };
  }

  for (const message of messages) {
    validateMessage(message);
  }

  return null;
} 