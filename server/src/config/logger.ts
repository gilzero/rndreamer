/**
 * @fileoverview Logging configuration for the application.
 * @filepath src/config/logger.ts
 * Provides centralized logging functionality with multiple transports (file, console).
 * 
 * @module config/logger
 * @requires winston
 */
import { createLogger, format, transports, transport } from 'winston';
import path from 'path';
import chalk from 'chalk';
import fs from 'fs';

/**
 * Configuration constants for logging
 */
/** Path where log files will be stored */
const LOG_FILE_PATH = process.env['LOG_FILE_PATH'] || 'logs/app.log';

/** Minimum level of logs to capture */
const LOG_LEVEL = process.env['LOG_LEVEL'] || 'info';

/** Maximum size of each log file in MB */
const MAX_LOG_SIZE = parseInt(process.env['MAX_LOG_SIZE'] || '10', 10);

/** Maximum number of log files to keep */
const MAX_LOG_FILES = parseInt(process.env['MAX_LOG_FILES'] || '5', 10);

/** List of fields to redact in logs */
const SENSITIVE_FIELDS = ['password', 'token', 'apiKey', 'secret', 'authorization'];

// Ensure logs directory exists
const logDir = path.dirname(LOG_FILE_PATH);
fs.mkdirSync(logDir, { recursive: true });

/** Mapping of log levels to chalk colors */
const levelColors = {
    error: chalk.red,
    warn: chalk.yellow,
    info: chalk.blue,
    default: chalk.white
} as const;

/**
 * Custom format for console output with colors and better readability
 */
const consoleFormat = format.printf(({ level, message, timestamp, metadata }) => {
    const ts = chalk.gray(timestamp);
    const colorize = levelColors[level as keyof typeof levelColors] || levelColors.default;
    const metaStr = Object.keys(metadata as object || {}).length ? '\n' + JSON.stringify(metadata, null, 2) : '';
    
    return `${ts} [${colorize(level)}]: ${chalk.white(message)}${metaStr}`;
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
 * Includes file and console logging.
 */
const logTransports: transport[] = [
    // Always log to file with rotation
    new transports.File({ 
        filename: LOG_FILE_PATH,
        level: LOG_LEVEL,
        format: structuredFormat,
        maxsize: MAX_LOG_SIZE * 1024 * 1024, // Convert MB to bytes
        maxFiles: MAX_LOG_FILES,
        tailable: true,
        zippedArchive: true
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

/**
 * Sanitizes sensitive data from objects before logging
 */
const sanitizeData = (data: any): any => {
    if (!data || typeof data !== 'object') return data;
    
    return Object.entries(data).reduce((acc, [key, value]) => ({
        ...acc,
        [key]: SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field))
            ? '[REDACTED]'
            : typeof value === 'object' ? sanitizeData(value) : value
    }), Array.isArray(data) ? [] : {});
};

export default logger;

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

    logger.error('Application Error', logData);
};

/**
 * Helper function to parse response body data
 * @param body - Response body to parse
 */
const parseResponseBody = (body: any): any => {
    if (!body) return body;
    
    if (Array.isArray(body)) {
        try {
            const chunks = body.map(chunk => {
                if (chunk?.delta?.content) return chunk.delta.content;
                if (typeof chunk === 'string') return chunk;
                return '';
            }).filter(Boolean);

            return {
                chunks_count: body.length,
                content: chunks.join('')
            };
        } catch (error) {
            logger.warn('Error parsing streaming response body', { error });
            return { 
                chunks_count: body.length,
                content: '[Error parsing streaming response]'
            };
        }
    }
    return body;
}; 