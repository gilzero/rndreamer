/**
 * @fileoverview Consolidated type definitions
 *
 * @filepath nodeserver/src/types.ts
 */

export enum ChatProvider {
    GPT = 'gpt',
    CLAUDE = 'claude',
    GEMINI = 'gemini'
}

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    metadata?: {
        timestamp?: number;
        model?: string;
        tokens?: number;
    };
}

export interface ChatOptions {
    provider: ChatProvider;
    model?: string;
    temperature?: number;
}

export interface AppError extends Error {
    statusCode?: number;
    details?: Record<string, unknown>;
}

export interface HealthCheckResponse {
    status: 'OK' | 'ERROR';
    provider?: ChatProvider | undefined;
    message: string | undefined;
    metrics?: {
        responseTime: number;
    } | undefined;
    error?: {
        type: string;
        message: string;
    } | undefined;
} 