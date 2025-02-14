import { DOMAIN } from '../constants'
import EventSource from 'react-native-sse'
import { Model, ModelProvider, ChatMessage } from '../types'

// Constants for message validation from environment
export const MESSAGE_LIMITS = {
  MAX_MESSAGE_LENGTH: Number(process.env.EXPO_PUBLIC_MAX_MESSAGE_LENGTH || 24000),
  MAX_MESSAGES_IN_CONTEXT: Number(process.env.EXPO_PUBLIC_MAX_MESSAGES_IN_CONTEXT || 50),
  MIN_MESSAGE_LENGTH: Number(process.env.EXPO_PUBLIC_MIN_MESSAGE_LENGTH || 1)
} as const;

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

export function getChatType(type: Model): ModelProvider {
  const label = type.label.toLowerCase();
  
  if (label.includes('gpt')) return 'gpt';
  if (label.includes('gemini')) return 'gemini';
  if (label.includes('claude')) return 'claude';
  
  throw new Error(`Unsupported model type: ${type.label}. Must be one of: gpt, claude, or gemini`);
}

export interface MessageValidationError {
  message: string;
  code: 'EMPTY_MESSAGE' | 'MESSAGE_TOO_LONG' | 'TOO_MANY_MESSAGES' | 'INVALID_ROLE';
}

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