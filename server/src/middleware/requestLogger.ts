/**
 * @fileoverview Request logging middleware for Express applications.
 * @filepath src/middleware/requestLogger.ts   
 * Provides complete request/response logging capabilities with timing and metadata.
 * 
 * @module middleware/requestLogger
 * @requires express
 */
import { Request, Response, NextFunction } from 'express';
import { logRequest } from '../config/logger';

/**
 * Express middleware that logs complete information about HTTP requests and responses.
 * Captures request/response bodies, headers, timing, and other metadata.
 * 
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();
    let chunks: any[] = [];
    let responseBody: any;
    let isStreaming = false;
    
    // Store original response methods
    const originalSend = res.send;
    const originalJson = res.json;
    const originalWrite = res.write;
    const originalEnd = res.end;

    // Override response.send()
    res.send = function (body: any) {
        responseBody = body;
        return originalSend.apply(res, arguments as any);
    };

    // Override response.json()
    res.json = function (body: any) {
        responseBody = body;
        return originalJson.apply(res, arguments as any);
    };

    // Override response.write() for streaming responses
    res.write = function (chunk: any) {
        if (chunk) {
            const strChunk = chunk.toString();
            // Only collect data: prefixed chunks for SSE
            if (strChunk.startsWith('data: ')) {
                isStreaming = true;
                const cleanChunk = strChunk.replace('data: ', '').trim();
                if (cleanChunk && cleanChunk !== '[DONE]') {
                    try {
                        const jsonChunk = JSON.parse(cleanChunk);
                        if (jsonChunk.delta?.content) {
                            chunks.push(jsonChunk);
                        }
                    } catch (e) {
                        // If parsing fails, store raw chunk
                        chunks.push(cleanChunk);
                    }
                }
            }
        }
        return originalWrite.apply(res, arguments as any);
    };

    // Override response.end()
    res.end = function (chunk: any) {
        if (chunk) {
            const strChunk = chunk.toString();
            if (strChunk.startsWith('data: ')) {
                isStreaming = true;
                const cleanChunk = strChunk.replace('data: ', '').trim();
                if (cleanChunk && cleanChunk !== '[DONE]') {
                    try {
                        const jsonChunk = JSON.parse(cleanChunk);
                        if (jsonChunk.delta?.content) {
                            chunks.push(jsonChunk);
                        }
                    } catch (e) {
                        chunks.push(cleanChunk);
                    }
                }
            }
        }

        // Wait for next tick to ensure all chunks are collected
        process.nextTick(() => {
            const duration = Date.now() - start;
            const finalBody = isStreaming ? chunks : responseBody;
            logRequest(req, res, duration, finalBody);
        });
        
        return originalEnd.apply(res, arguments as any);
    };
    
    next();
}; 