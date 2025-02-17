/**
 * @fileoverview Core type definitions for chat functionality.
 * @filepath src/chat/types.ts
 */

/**
 * Supported AI model providers.
 * Used for routing and model selection.
 */
export enum ChatProvider {
    /** OpenAI's GPT models (gpt-4o, gpt-4o-mini) */
    GPT = 'gpt',
    /** Anthropic's Claude models (claude-3-5-sonnet-latest, claude-3-5-haiku-latest) */
    CLAUDE = 'claude',
    /** Google's Gemini models (gemini-2.0-flash, gemini-1.5-pro) */
    GEMINI = 'gemini'
}

/**
 * A single message in a chat conversation.
 * Compatible with LangChain message format.
 */
export interface ChatMessage {
    /** The role of the message sender */
    role: 'user' | 'assistant' | 'system';
    
    /** The actual content/text of the message */
    content: string;
    
    /** Optional metadata for message tracking and analysis */
    metadata?: {
        /** Timestamp when message was created */
        timestamp?: number;
        /** Model that generated this message (for assistant responses) */
        model?: string;
        /** Token count for the message */
        tokens?: number;
    };
}

/**
 * Configuration options for chat requests.
 * Used to configure provider and model settings.
 */
export interface ChatOptions {
    /** The AI provider to use for this request */
    provider: ChatProvider;
    
    /** Specific model identifier (e.g., 'gpt-4o' for GPT) */
    model?: string;
    
    /** Temperature setting for response generation (0.0 to 1.0) */
    temperature?: number;
} 