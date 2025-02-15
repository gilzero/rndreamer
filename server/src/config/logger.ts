/**
 * @fileoverview Logging configuration for the application.
 * @filepath src/config/logger.ts
 * Provides centralized logging functionality with multiple transports (file, console, Datadog).
 * 
 * @module config/logger
 * @requires winston
 */
import { createLogger, format, transports, transport } from 'winston';
import path from 'path';
import chalk from 'chalk';

/** Path where log files will be stored */
const LOG_FILE_PATH = process.env['LOG_FILE_PATH'] || 'logs/app.log';

/** Minimum level of logs to capture */
const LOG_LEVEL = process.env['LOG_LEVEL'] || 'info';

/** Datadog API key for log forwarding */
const DATADOG_API_KEY = process.env['DATADOG_API_KEY'];

/** Flag indicating whether Datadog integration is enabled */
const DATADOG_ENABLED = process.env['ENABLE_DATADOG'] === 'true';

// Ensure logs directory exists
const logDir = path.dirname(LOG_FILE_PATH);
require('fs').mkdirSync(logDir, { recursive: true });

/**
 * Custom format for console output with colors and better readability
 */
const consoleFormat = format.printf(({ level, message, timestamp, ...metadata }) => {
    const ts = chalk.gray(timestamp);
    const msg = chalk.white(message);
    
    let levelColor;
    switch(level) {
        case 'error': levelColor = chalk.red(level); break;
        case 'warn': levelColor = chalk.yellow(level); break;
        case 'info': levelColor = chalk.blue(level); break;
        default: levelColor = chalk.white(level);
    }

    // Flatten nested metadata
    const flatMetadata = metadata['metadata'] || {};
    let metaStr = '';
    if (Object.keys(flatMetadata).length > 0) {
        metaStr = '\n' + JSON.stringify(flatMetadata, null, 2);
    }

    return `${ts} [${levelColor}]: ${msg}${metaStr}`;
});

/**
 * Custom format configuration for structured logging.
 * Combines timestamp, error stacks, metadata, and JSON formatting.
 */
const structuredFormat = format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.metadata(),
    format.json()
);

/**
 * Array of configured Winston transport instances.
 * Includes file and console logging by default, with optional Datadog transport.
 */
const logTransports: transport[] = [
    // Always log to file
    new transports.File({ 
        filename: LOG_FILE_PATH,
        level: LOG_LEVEL,
        format: structuredFormat
    }),
    // Console transport for development with pretty formatting
    new transports.Console({
        level: LOG_LEVEL,
        format: format.combine(
            format.timestamp(),
            format.colorize(),
            consoleFormat
        )
    })
];

// Add Datadog HTTP transport if enabled
if (DATADOG_ENABLED && DATADOG_API_KEY) {
    console.log(chalk.green('✓ Datadog logging enabled'));
    const datadogTransport = new transports.Http({
        host: 'http-intake.logs.datadoghq.com',
        path: `/api/v2/logs?dd-api-key=${DATADOG_API_KEY}&ddsource=nodejs&service=ai-chat-app`,
        ssl: true,
        format: structuredFormat
    });

    // Add error handler for Datadog transport
    datadogTransport.on('error', (error) => {
        console.error(chalk.red('Datadog transport error:'), error);
    });

    datadogTransport.on('logged', (info) => {
        console.log(chalk.blue('✓ Successfully sent to Datadog:'), info.message);
    });

    logTransports.push(datadogTransport);
} else {
    console.log(chalk.yellow('⚠ Datadog logging disabled'));
}

/**
 * Configured Winston logger instance with multiple transports.
 * Provides structured logging with consistent metadata across all log entries.
 */
const logger = createLogger({
    level: LOG_LEVEL,
    exitOnError: false,
    format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.metadata({
            fillExcept: ['level', 'message', 'timestamp']
        }),
        format.json()
    ),
    transports: logTransports,
    defaultMeta: { 
        service: 'ai-chat-app',
        environment: process.env['NODE_ENV'] || 'development'
    }
});

// Error handler for transports
logTransports.forEach(transport => {
    transport.on('error', (error) => {
        console.error(chalk.red('Logger transport error:'), error);
    });
});

/**
 * Sanitizes sensitive data from objects before logging
 */
const sanitizeData = (data: any): any => {
    if (!data) return data;
    
    const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'authorization'];
    
    if (typeof data === 'object') {
        const sanitized = Array.isArray(data) ? [...data] : { ...data };
        
        Object.keys(sanitized).forEach(key => {
            if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
                sanitized[key] = '[REDACTED]';
            } else if (typeof sanitized[key] === 'object') {
                sanitized[key] = sanitizeData(sanitized[key]);
            }
        });
        
        return sanitized;
    }
    
    return data;
};

/**
 * Handles streaming response data for logging
 */
const handleStreamingResponse = (chunks: any[]): any => {
    if (!chunks || chunks.length === 0) return null;
    
    try {
        // Filter out [DONE] messages and empty deltas
        const validChunks = chunks
            .filter(chunk => chunk !== '[DONE]' && chunk?.delta?.content)
            .map(chunk => {
                if (typeof chunk === 'string') {
                    return JSON.parse(chunk);
                }
                return chunk;
            });

        // Combine all chunks into a single response
        const combinedResponse = {
            id: validChunks[0]?.id,
            content: validChunks
                .map(chunk => chunk.delta.content)
                .join(''),
            chunks_count: validChunks.length
        };

        return combinedResponse;
    } catch (error) {
        return {
            error: 'Failed to parse streaming response',
            raw: chunks
        };
    }
};

/**
 * Parses response body to ensure it's in a readable format
 */
const parseResponseBody = (body: any): any => {
    if (!body) return body;
    
    try {
        // Handle array of chunks (streaming response)
        if (Array.isArray(body)) {
            return handleStreamingResponse(body);
        }

        // If body is already an object, return it
        if (typeof body === 'object' && !Buffer.isBuffer(body)) {
            return body;
        }
        
        // If body is a string that looks like JSON, parse it
        if (typeof body === 'string' && (body.startsWith('{') || body.startsWith('['))) {
            return JSON.parse(body);
        }
        
        // If body is a Buffer or string, convert to string
        if (Buffer.isBuffer(body) || typeof body === 'string') {
            return body.toString();
        }
        
        return body;
    } catch (error) {
        return String(body);
    }
};

/**
 * Logs HTTP request information in a structured format.
 * Captures complete request and response data with sanitization.
 * 
 * @param req - Express request object containing request details
 * @param res - Express response object containing response details
 * @param duration - Request processing duration in milliseconds
 * @param responseBody - Optional response body data
 */
export const logRequest = (req: any, res: any, duration: number, responseBody?: any) => {
    const requestData = {
        method: req.method,
        url: req.originalUrl || req.url,
        params: req.params,
        query: req.query,
        headers: sanitizeData(req.headers),
        body: sanitizeData(req.body),
        ip: req.ip,
        userAgent: req.get('user-agent'),
    };

    const parsedBody = parseResponseBody(responseBody);
    const responseData = {
        status: res.statusCode,
        headers: sanitizeData(res.getHeaders()),
        body: sanitizeData(parsedBody),
        type: Array.isArray(responseBody) ? 'streaming' : 'regular'
    };

    const logData = {
        type: 'http_request',
        duration: `${duration}ms`,
        request: requestData,
        response: responseData,
        timestamp: new Date().toISOString()
    };

    // Format the log message for better readability
    const logMessage = `${req.method} ${req.originalUrl || req.url} ${res.statusCode} ${duration}ms`;

    // Log to Datadog if enabled
    if (DATADOG_ENABLED) {
        logger.info(logMessage, logData);
        console.log(chalk.blue('✓ Request logged to Datadog'));
        return;
    }

    // Log to console and file only if Datadog is disabled
    logger.info(logMessage, logData);
};

/**
 * Logs AI provider request information and performance metrics.
 * Tracks success/failure status and execution duration.
 * 
 * @param provider - Name of the AI provider (e.g., 'GPT', 'Claude', 'Gemini')
 * @param duration - Request processing duration in milliseconds
 * @param success - Whether the request was successful
 * @param error - Optional error object if the request failed
 */
export const logAIRequest = (provider: string, duration: number, success: boolean, error?: any) => {
    const logData = {
        type: 'ai_request',
        provider,
        duration: `${duration}ms`,
        success,
        error: error ? {
            message: error.message,
            stack: error.stack
        } : undefined,
        timestamp: new Date().toISOString()
    };

    if (DATADOG_ENABLED) {
        logger.info('AI Request', logData);
        console.log(chalk.blue(`✓ AI Request (${provider}) logged to Datadog`));
        return;
    }

    logger.info('AI Request', logData);
};

/**
 * Logs application errors with full stack traces and context.
 * Provides structured error logging with additional contextual information.
 * 
 * @param error - Error object to be logged
 * @param context - Optional additional context data to include in the log
 */
export const logError = (error: Error, context?: any) => {
    const logData = {
        type: 'error',
        error: {
            message: error.message,
            stack: error.stack,
            ...sanitizeData(context)
        },
        timestamp: new Date().toISOString()
    };

    if (DATADOG_ENABLED) {
        logger.error('Application Error', logData);
        console.log(chalk.red('✓ Error logged to Datadog'));
        return;
    }

    logger.error('Application Error', logData);
};

export default logger; 