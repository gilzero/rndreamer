/**
 * @fileoverview Consolidated configuration, validation, rate limiting, and logging
 */
import { createLogger, format, transports } from 'winston';
import rateLimit from 'express-rate-limit';
import path from 'path';
import chalk from 'chalk';
import fs from 'fs';
import { Request } from 'express';

// ===== Logging Configuration =====
const LOG_FILE_PATH = process.env['LOG_FILE_PATH'] || 'logs/app.log';
const LOG_LEVEL = process.env['LOG_LEVEL'] || 'info';
const MAX_LOG_SIZE = parseInt(process.env['MAX_LOG_SIZE'] || '10', 10);
const MAX_LOG_FILES = parseInt(process.env['MAX_LOG_FILES'] || '5', 10);
const SENSITIVE_FIELDS = ['password', 'token', 'apiKey', 'secret', 'authorization'];

// Ensure logs directory exists
fs.mkdirSync(path.dirname(LOG_FILE_PATH), { recursive: true });

// Logger setup
const logger = createLogger({
    level: LOG_LEVEL,
    format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.metadata(),
        format.json()
    ),
    transports: [
        new transports.File({ 
            filename: LOG_FILE_PATH,
            maxsize: MAX_LOG_SIZE * 1024 * 1024,
            maxFiles: MAX_LOG_FILES,
            tailable: true,
            zippedArchive: true
        }),
        new transports.Console({
            format: format.combine(
                format.timestamp(),
                format.colorize(),
                format.printf(({ level, message, timestamp, metadata }) => {
                    const ts = chalk.gray(timestamp);
                    const color = level === 'error' ? chalk.red : 
                                level === 'warn' ? chalk.yellow : chalk.blue;
                    const meta = Object.keys(metadata as object || {}).length ? 
                                '\n' + JSON.stringify(metadata, null, 2) : '';
                    return `${ts} [${color(level)}]: ${message}${meta}`;
                })
            )
        })
    ]
});

// ===== Rate Limiting Configuration =====
const RATE_LIMITS = {
    WINDOW_MS: Number(process.env['RATE_LIMIT_WINDOW_MS'] || 60 * 60 * 1000),
    MAX_REQUESTS: Number(process.env['RATE_LIMIT_MAX_REQUESTS'] || 500),
    GPT_MAX: Number(process.env['GPT_RATE_LIMIT_MAX'] || 200),
    CLAUDE_MAX: Number(process.env['CLAUDE_RATE_LIMIT_MAX'] || 200),
    GEMINI_MAX: Number(process.env['GEMINI_RATE_LIMIT_MAX'] || 200),
} as const;

const createRateLimiter = (maxRequests: number) => rateLimit({
    windowMs: RATE_LIMITS.WINDOW_MS,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: (req: Request) => ({
        error: `${req.path.includes('gpt') ? 'GPT' : 
               req.path.includes('claude') ? 'Claude' : 
               req.path.includes('gemini') ? 'Gemini' : 'API'} 
               request limit exceeded, please try again later.`
    })
});

// ===== Message Validation Configuration =====
const MESSAGE_LIMITS = {
    MAX_MESSAGE_LENGTH: Number(process.env['MAX_MESSAGE_LENGTH'] || 24000),
    MAX_MESSAGES_IN_CONTEXT: Number(process.env['MAX_MESSAGES_IN_CONTEXT'] || 50),
    MIN_MESSAGE_LENGTH: Number(process.env['MIN_MESSAGE_LENGTH'] || 1),
} as const;

// ===== Exports =====
export {
    logger,
    RATE_LIMITS,
    MESSAGE_LIMITS,
    createRateLimiter
};

// Validation functions
export const validateMessage = (message: { role: string; content: string }) => {
    if (!message.content?.trim()) {
        return { message: 'Message content cannot be empty', code: 'EMPTY_MESSAGE' as const };
    }
    if (message.content.length > MESSAGE_LIMITS.MAX_MESSAGE_LENGTH) {
        return { 
            message: `Message exceeds maximum length of ${MESSAGE_LIMITS.MAX_MESSAGE_LENGTH} characters`,
            code: 'MESSAGE_TOO_LONG' as const 
        };
    }
    if (!['user', 'assistant', 'system'].includes(message.role)) {
        return { message: 'Invalid message role', code: 'INVALID_ROLE' as const };
    }
    return null;
};

export const validateMessages = (messages: { role: string; content: string }[]) => {
    if (messages.length > MESSAGE_LIMITS.MAX_MESSAGES_IN_CONTEXT) {
        return {
            message: `Conversation exceeds maximum of ${MESSAGE_LIMITS.MAX_MESSAGES_IN_CONTEXT} messages`,
            code: 'TOO_MANY_MESSAGES' as const
        };
    }
    for (const message of messages) {
        const error = validateMessage(message);
        if (error) return error;
    }
    return null;
};

// Logging utilities
export const logRequest = (req: any, res: any, duration: number, responseBody?: any) => {
    const sanitizedData = JSON.parse(JSON.stringify({
        request: {
            method: req.method,
            url: req.originalUrl,
            params: req.params,
            query: req.query,
            headers: req.headers,
            body: req.body
        },
        response: {
            status: res.statusCode,
            headers: res.getHeaders(),
            body: responseBody
        }
    }));

    // Redact sensitive fields
    type RedactedValue = string | number | boolean | null | RedactedObject | RedactedArray;
    interface RedactedObject { [key: string]: RedactedValue }
    interface RedactedArray extends Array<RedactedValue> {}

    const redact = (obj: unknown): RedactedValue => {
        if (typeof obj !== 'object' || !obj) return obj as RedactedValue;
        
        return Object.entries(obj as object).reduce<RedactedObject | RedactedArray>((acc, [key, value]) => {
            const redactedValue = SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field))
                ? '[REDACTED]'
                : typeof value === 'object' ? redact(value) : value;

            if (Array.isArray(acc)) {
                (acc as RedactedValue[]).push(redactedValue);
                return acc;
            }
            
            return {
                ...acc,
                [key]: redactedValue
            };
        }, Array.isArray(obj) ? [] : {});
    };

    const redactedData = redact(sanitizedData) as Record<string, unknown>;

    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`, {
        ...redactedData,
        duration: `${duration}ms`
    });
}; 