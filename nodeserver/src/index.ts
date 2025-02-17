import express, { Request, Response, NextFunction } from 'express';
import chatRouter, { chatService } from './chat/chatService';
import 'dotenv/config';
import { requestLogger } from './middleware/requestLogger';
import { ChatProvider, ChatMessage } from './chat/types';
import logger, { logAIRequest, logError } from './config/logger';

const app = express();

// Configure middleware
app.use(requestLogger);
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '50mb' }));

interface AppError extends Error {
  statusCode?: number;
  details?: Record<string, unknown>;
}

interface HealthCheckResponse {
  status: 'OK' | 'ERROR';
  provider: ChatProvider | undefined;
  message: string | undefined;
  metrics?: {
    responseTime: number;
  };
  error?: {
    type: string;
    message: string;
  };
}

const createHealthResponse = (
  status: 'OK' | 'ERROR',
  options: {
    provider?: ChatProvider;
    duration?: number;
    error?: Error; // Always an Error object
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
        },
      }),
    };
  }

  return {
    status,
    provider,
    message: message || undefined,
    metrics: {
      responseTime: duration ?? 0,
    },
  };
};

/**
 * Main health check endpoint.
 * @route GET /health
 * @returns {object} Overall system health status.
 */
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json(createHealthResponse('OK', { message: 'System operational' }));
});

/**
 * Abstracted health check for AI providers.
 */
const providerHealthCheck = async (provider: ChatProvider, res: Response) => {
  const start = Date.now();
  try {
    const messages: ChatMessage[] = [{ role: 'user', content: 'ping' }];
    await chatService.chat(messages, { provider });
    const duration = Date.now() - start;
    logAIRequest(provider, duration, true); // Simpler logging
    res.status(200).json(createHealthResponse('OK', { provider, duration }));
  } catch (error: unknown) { // Use unknown
    const duration = Date.now() - start;
    const err = error instanceof Error ? error : new Error('Unknown AI provider error');
    logAIRequest(provider, duration, false, err); // Log the Error object
    res.status(503).json(createHealthResponse('ERROR', { provider, error: err })); // Pass the Error
  }
};

/**
 * Generic health check endpoint for AI providers.
 * @route GET /health/:provider
 * @returns {object} Status of the specified provider.
 */
app.get('/health/:provider', async (req: Request, res: Response) => {
  const providerName = req.params['provider']?.toUpperCase();

  if (!providerName || !(providerName in ChatProvider)) {
    return res.status(400).json(
      createHealthResponse('ERROR', { message: `Invalid provider: ${providerName || 'undefined'}` })
    );
  }

  return await providerHealthCheck(
    ChatProvider[providerName as keyof typeof ChatProvider],
    res
  );
});

/**
 * Health check endpoint.
 * @route GET /
 * @returns {string} Simple health check message.
 */
app.get('/', (_req: Request, res: Response) => {
  res.send('Hello World!');
});

// Mount chat routes
app.use('/chat', chatRouter);

// Error handling middleware
app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    const appError: AppError = err instanceof Error ? err : new Error('An unknown error occurred');
    const statusCode = appError.statusCode || 500;

    logError(appError, {
        path: req.path,
        method: req.method,
        statusCode,
        ...(appError.details && { details: appError.details }), // Conditionally include details
        headers: {
            'user-agent': req.headers['user-agent'],
            accept: req.headers.accept,
        },
    });

    res.status(statusCode).json({
        error: appError.message || 'Internal Server Error',
        // Conditionally include details in non-production
        ...(process.env['NODE_ENV'] !== 'production' && appError.details && { details: appError.details }),
    });
});

// Start server
const port = Number(process.env['PORT']) || 3050;
app.listen(port, () => {
  logger.info(`Server started on port ${port}`, {
    environment: process.env['NODE_ENV'],
  });
});