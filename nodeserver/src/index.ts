/**
 * @fileoverview Main server entry point with consolidated functionality
 *
 * @filepath nodeserver/src/index.ts
 */
import express, { Request, Response, NextFunction } from 'express';
import 'dotenv/config';
import chatRouter, { chatService } from './chat';
import { logger, logRequest } from './config';
import { AppError, ChatProvider, HealthCheckResponse } from './types';

const app = express();

// Middleware for request logging
app.use((req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    const chunks: any[] = [];
    let isStreaming = false;

    // Store original methods
    const originalWrite = res.write;
    const originalEnd = res.end;

    // Override write method to capture streaming responses
    res.write = function (chunk: any, encoding?: BufferEncoding | ((error: Error | null | undefined) => void), 
        callback?: (error: Error | null | undefined) => void): boolean {
        if (chunk) {
            const strChunk = typeof chunk === 'string' ? chunk : chunk.toString();
            if (strChunk.startsWith('data: ')) {
                isStreaming = true;
                const cleanChunk = strChunk.substring(6).trim();
                if (cleanChunk !== '[DONE]') {
                    try {
                        const jsonChunk = JSON.parse(cleanChunk);
                        if (jsonChunk?.delta?.content) {
                            chunks.push(jsonChunk.delta.content);
                        }
                    } catch (e) {}
                }
            }
        }
        return originalWrite.call(res, chunk, encoding as BufferEncoding, callback);
    };

    // Override end method to log the complete request
    res.end = function (chunk?: any, encoding?: BufferEncoding | (() => void), 
        callback?: () => void): Response {
        const duration = Date.now() - start;
        const responseBody = isStreaming ? chunks.join('') : chunk;
        logRequest(req, res, duration, responseBody);
        return originalEnd.call(res, chunk, encoding as BufferEncoding, callback);
    };

    next();
});

// Basic middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check response creator
const createHealthResponse = (
    status: 'OK' | 'ERROR',
    options: {
        provider?: ChatProvider;
        duration?: number;
        error?: Error;
        message?: string;
    }
): HealthCheckResponse => {
    const { provider, duration, error, message } = options;

    if (status === 'ERROR') {
        return {
            status,
            provider,
            message: message ?? error?.message ?? 'An unknown error occurred',
            ...(error && {
                error: {
                    type: error.constructor.name,
                    message: error.message,
                }
            })
        };
    }

    return {
        status,
        provider,
        message: message || undefined,
        ...(duration && {
            metrics: {
                responseTime: duration
            }
        })
    };
};

// Health check endpoints
app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json(createHealthResponse('OK', { 
        message: 'System operational' 
    }));
});

app.get('/health/:provider', async (req: Request, res: Response) => {
    const providerName = req.params['provider']?.toUpperCase();
    
    if (!providerName || !(providerName in ChatProvider)) {
        return res.status(400).json(
            createHealthResponse('ERROR', { 
                message: `Invalid provider: ${providerName || 'undefined'}` 
            })
        );
    }

    const provider = ChatProvider[providerName as keyof typeof ChatProvider];
    const start = Date.now();

    try {
        await chatService.chat(
            [{ role: 'user', content: 'ping' }],
            { provider }
        );
        const duration = Date.now() - start;
        return res.status(200).json(createHealthResponse('OK', { provider, duration }));
    } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        return res.status(503).json(createHealthResponse('ERROR', { provider, error: err }));
    }
});

// Mount chat routes
app.use('/chat', chatRouter);

// Error handling
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    const error = err instanceof Error ? err : new Error('Unknown error');
    const appError: AppError = error;
    const statusCode = appError.statusCode || 500;

    logger.error('Application error:', {
        path: req.path,
        method: req.method,
        statusCode,
        error: {
            message: error.message,
            stack: error.stack,
            ...(appError.details && { details: appError.details })
        }
    });

    return res.status(statusCode).json({
        error: error.message || 'Internal Server Error',
        ...(process.env['NODE_ENV'] !== 'production' && appError.details && { 
            details: appError.details 
        })
    });
});

// Start server
const port = Number(process.env['PORT']) || 3050;
const nodeEnv = process.env['NODE_ENV'];
app.listen(port, () => {
    logger.info(`Server started on port ${port}`, {
        environment: nodeEnv
    });
});

export default app;