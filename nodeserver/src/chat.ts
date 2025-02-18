/**
 * @fileoverview Consolidated chat service with LangChain integration
 *
 * @filepath nodeserver/src/chat.ts
 */
import { Router, Request, Response } from "express";
import asyncHandler from 'express-async-handler';
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { BaseMessage, AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatMessage, ChatOptions, ChatProvider } from './types';
import { logger, validateMessages, createRateLimiter } from './config';

// Rate limiters
const apiLimiter = createRateLimiter(500);
const gptLimiter = createRateLimiter(200);
const claudeLimiter = createRateLimiter(200);
const geminiLimiter = createRateLimiter(200);

/**
 * Model configuration by provider
 */
const VALID_MODELS = {
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
} as const;

class ChatError extends Error {
    constructor(
        message: string,
        public provider: string,
        public statusCode: number = 500,
        public originalError?: Error
    ) {
        super(message);
        this.name = 'ChatError';
    }
}

class ChatService {
    public router: Router;

    constructor() {
        this.router = Router();
        this.setupRoutes();
    }

    private setupRoutes() {
        // Apply general rate limiting
        this.router.use(apiLimiter);

        // Provider routes
        this.router.post('/gpt', gptLimiter, this.createHandler(ChatProvider.GPT));
        this.router.post('/claude', claudeLimiter, this.createHandler(ChatProvider.CLAUDE));
        this.router.post('/gemini', geminiLimiter, this.createHandler(ChatProvider.GEMINI));
    }

    private createHandler(provider: ChatProvider) {
        return asyncHandler(async (req: Request, res: Response) => {
            const { messages, model } = req.body;
            
            // Validate messages
            const validationError = validateMessages(messages);
            if (validationError) {
                throw new ChatError(validationError.message, provider, 400);
            }

            try {
                res.writeHead(200, {
                    'Content-Type': 'text/event-stream',
                    'Connection': 'keep-alive',
                    'Cache-Control': 'no-cache'
                });

                // Validate model
                if (model && !VALID_MODELS[provider].allowed.includes(model)) {
                    throw new ChatError(
                        `Invalid model: ${model}. Valid models are: ${VALID_MODELS[provider].allowed.join(', ')}`,
                        provider,
                        400
                    );
                }

                await this.streamChat(messages, { provider, model }, res);
            } catch (error) {
                const chatError = error instanceof ChatError ? error :
                    new ChatError(error instanceof Error ? error.message : 'Unknown error', provider, 500);
                
                res.write(`data: {"error": "${chatError.message}"}\n\n`);
                res.write('data: [DONE]\n\n');
                res.end();
            }
        });
    }

    private async createModel(options: ChatOptions) {
        const { provider, model, temperature = 0.3 } = options;
        const modelName = model || VALID_MODELS[provider].default;

        try {
            switch (provider) {
                case ChatProvider.GPT:
                    if (!process.env['OPENAI_API_KEY']) {
                        throw new ChatError('OpenAI API key not configured', provider, 500);
                    }
                    return new ChatOpenAI({
                        modelName,
                        temperature,
                        streaming: true,
                        openAIApiKey: process.env['OPENAI_API_KEY']
                    });

                case ChatProvider.CLAUDE:
                    if (!process.env['ANTHROPIC_API_KEY']) {
                        throw new ChatError('Anthropic API key not configured', provider, 500);
                    }
                    return new ChatAnthropic({
                        modelName,
                        temperature,
                        streaming: true,
                        anthropicApiKey: process.env['ANTHROPIC_API_KEY']
                    });

                case ChatProvider.GEMINI:
                    if (!process.env['GEMINI_API_KEY']) {
                        throw new ChatError('Gemini API key not configured', provider, 500);
                    }
                    return new ChatGoogleGenerativeAI({
                        modelName,
                        temperature,
                        streaming: true,
                        apiKey: process.env['GEMINI_API_KEY']
                    });

                default:
                    throw new ChatError(`Unsupported provider: ${provider}`, provider, 400);
            }
        } catch (error) {
            if (error instanceof ChatError) throw error;
            throw new ChatError(
                'Failed to initialize AI model',
                provider,
                500,
                error instanceof Error ? error : undefined
            );
        }
    }

    private convertMessages(messages: ChatMessage[]): BaseMessage[] {
        return messages.map(msg => {
            switch (msg.role) {
                case 'user': return new HumanMessage(msg.content);
                case 'assistant': return new AIMessage(msg.content);
                case 'system': return new SystemMessage(msg.content);
                default: throw new ChatError(`Invalid message role: ${msg.role}`, 'unknown', 400);
            }
        });
    }

    async streamChat(messages: ChatMessage[], options: ChatOptions, res: Response) {
        const messageId = `${options.provider}-${Date.now()}`;
        let streamStarted = false;

        try {
            const model = await this.createModel(options);
            const langchainMessages = this.convertMessages(messages);
            const stream = await model.stream(langchainMessages);

            for await (const chunk of stream) {
                if (chunk?.content) {
                    streamStarted = true;
                    res.write(`data: ${JSON.stringify({
                        id: messageId,
                        delta: { content: chunk.content }
                    })}\n\n`);
                }
            }

            if (!streamStarted) {
                throw new ChatError('No content received from model', options.provider);
            }

            res.write('data: [DONE]\n\n');
        } catch (error) {
            const chatError = error instanceof ChatError ? error :
                new ChatError('Stream error occurred', options.provider, 500, 
                            error instanceof Error ? error : undefined);
            
            logger.error('Chat stream error:', {
                provider: options.provider,
                error: chatError
            });

            if (!streamStarted) {
                res.write(`data: {"error": "${chatError.message}"}\n\n`);
                res.write('data: [DONE]\n\n');
            }
        } finally {
            res.end();
        }
    }

    async chat(messages: ChatMessage[], options: ChatOptions): Promise<string> {
        try {
            const model = await this.createModel(options);
            const langchainMessages = this.convertMessages(messages);
            const response = await model.invoke(langchainMessages);
            return response.content.toString();
        } catch (error) {
            throw new ChatError(
                'Failed to get chat response',
                options.provider,
                500,
                error instanceof Error ? error : undefined
            );
        }
    }
}

export const chatService = new ChatService();
export default chatService.router; 