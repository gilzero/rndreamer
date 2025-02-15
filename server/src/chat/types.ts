/**
 * @fileoverview Type definitions for chat functionality.
 * @filepath src/chat/types.ts
 * Supported chat model providers for the application.
 */
export enum ChatProvider {
    /** OpenAI's GPT models */
    GPT = 'gpt',
    /** Anthropic's Claude models */
    CLAUDE = 'claude',
    /** Google's Gemini models */
    GEMINI = 'gemini'
}

/**
 * Represents a single message in a chat conversation.
 */
export interface ChatMessage {
    /** 
     * The role of the message sender.
     * Typically 'user', 'assistant', or 'system'
     */
    role: string;
    
    /**
     * The actual content/text of the message
     */
    content: string;
}

/**
 * Configuration options for chat requests.
 */
export interface ChatOptions {
    /** 
     * The AI provider to use for this chat request
     */
    provider: ChatProvider;
} 