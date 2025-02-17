/**
 * @fileoverview Core chat service and routing implementation.
 * @filepath src/chat/chatService.ts
 * 
 * Provides:
 * - Unified interface to multiple AI providers
 * - Request routing and validation
 * - Model validation and fallback handling
 * - Streaming and non-streaming chat responses
 */

import { Router, Request, Response } from "express"
import asyncHandler from 'express-async-handler'
import { ChatMessage, ChatOptions, ChatProvider } from './types'
import { langchainService } from './langchainService'
import { validateMessages } from '../config/validation'
import { apiLimiter, gptLimiter, claudeLimiter, geminiLimiter } from '../config/rateLimit'

type LangChainProvider = 'gpt' | 'claude' | 'gemini'

type ValidModel = {
    [K in ChatProvider]: {
        default: string;
        allowed: string[];
    }
}

/**
 * Error class for chat-related errors
 */
class ChatServiceError extends Error {
    constructor(
        message: string,
        public statusCode: number = 400
    ) {
        super(message);
        this.name = 'ChatServiceError';
    }
}

/**
 * Service class handling chat interactions with various AI providers.
 * Manages routing messages to appropriate provider-specific handlers.
 */
class ChatService {
    public router: Router

    private readonly VALID_MODELS: ValidModel = {
        [ChatProvider.GPT]: {
            default: process.env['OPENAI_MODEL_DEFAULT'] || 'gpt-4o',
            allowed: [
                process.env['OPENAI_MODEL_DEFAULT'] || 'gpt-4o',
                process.env['OPENAI_MODEL_FALLBACK'] || 'gpt-4o-mini'
            ]
        },
        [ChatProvider.CLAUDE]: {
            default: process.env['ANTHROPIC_MODEL_DEFAULT'] || 'claude-3-5-sonnet-latest',
            allowed: [
                process.env['ANTHROPIC_MODEL_DEFAULT'] || 'claude-3-5-sonnet-latest',
                process.env['ANTHROPIC_MODEL_FALLBACK'] || 'claude-3-5-haiku-latest'
            ]
        },
        [ChatProvider.GEMINI]: {
            default: process.env['GEMINI_MODEL_DEFAULT'] || 'gemini-2.0-flash',
            allowed: [
                process.env['GEMINI_MODEL_DEFAULT'] || 'gemini-2.0-flash',
                process.env['GEMINI_MODEL_FALLBACK'] || 'gemini-1.5-pro'
            ]
        }
    }

    constructor() {
        this.router = Router()
        this.setupRouter()
    }

    private setupRouter() {
        // Expose chatService for health checks
        Object.defineProperty(this.router, 'chatService', {
            value: this,
            writable: false,
            configurable: false
        })

        // Apply general rate limiting
        this.router.use(apiLimiter)

        // Validation middleware
        this.router.use(this.validateRequest)

        // Provider routes
        this.router.post('/gpt', gptLimiter, this.createHandler(ChatProvider.GPT))
        this.router.post('/claude', claudeLimiter, this.createHandler(ChatProvider.CLAUDE))
        this.router.post('/gemini', geminiLimiter, this.createHandler(ChatProvider.GEMINI))
    }

    private validateRequest(req: Request, res: Response, next: Function) {
        try {
            const { messages } = req.body
            
            if (!messages || !Array.isArray(messages)) {
                throw new ChatServiceError('Invalid messages format')
            }

            const validationError = validateMessages(messages)
            if (validationError) {
                throw new ChatServiceError(validationError.message)
            }

            next()
        } catch (error) {
            if (error instanceof ChatServiceError) {
                res.status(error.statusCode).json({ 
                    error: error.message 
                })
            } else {
                res.status(500).json({ 
                    error: 'Internal validation error' 
                })
            }
        }
    }

    /**
     * Creates a request handler for a specific chat provider.
     */
    public createHandler(provider: ChatProvider) {
        return asyncHandler(async (req: Request, res: Response): Promise<void> => {
            try {
                res.writeHead(200, {
                    'Content-Type': 'text/event-stream',
                    'Connection': 'keep-alive',
                    'Cache-Control': 'no-cache'
                })

                const { messages, model } = req.body
                
                // Validate model before starting stream
                if (model) {
                    const validModels = this.VALID_MODELS[provider]
                    if (!validModels.allowed.includes(model)) {
                        res.write(`data: {"error": "Invalid model: ${model}. Valid models are: ${validModels.allowed.join(', ')}"}\n\n`)
                        res.write('data: [DONE]\n\n')
                        res.end()
                        return
                    }
                }

                await this.chat(messages, {
                    provider,
                    ...(model && { model })
                }, res)
            } catch (err) {
                console.error(`Error in ${provider} chat:`, err)
                res.write(`data: {"error": "${err instanceof Error ? err.message : 'Unknown error'}"}\n\n`)
                res.write('data: [DONE]\n\n')
                res.end()
            }
        })
    }

    /**
     * Process a chat request with the specified provider.
     * Supports both streaming and non-streaming responses.
     * 
     * @param messages - Array of chat messages to process
     * @param options - Configuration options for the chat
     * @param res - Optional response object for streaming
     * @returns Promise resolving to response string for non-streaming requests
     */
    async chat(messages: ChatMessage[], options: ChatOptions, res?: Response): Promise<string | void> {
        const provider = this.mapProvider(options.provider)
        
        // Validate model if specified
        if (options.model) {
            const validModels = this.VALID_MODELS[options.provider]
            if (!validModels.allowed.includes(options.model)) {
                throw new Error(
                    `Invalid model: ${options.model}. Valid models for ${options.provider} are: ${validModels.allowed.join(', ')}`
                )
            }
        }
        
        if (res) {
            return await langchainService.streamChat(messages, { provider }, res)
        } else {
            return await langchainService.chat(messages, { provider })
        }
    }

    /**
     * Maps ChatProvider enum to LangChain provider strings.
     * @private
     */
    private mapProvider(provider: ChatProvider): LangChainProvider {
        switch (provider) {
            case ChatProvider.GPT: return 'gpt'
            case ChatProvider.CLAUDE: return 'claude'
            case ChatProvider.GEMINI: return 'gemini'
            default: throw new Error(`Unsupported provider: ${provider}`)
        }
    }
}

export const chatService = new ChatService()
export default chatService.router 