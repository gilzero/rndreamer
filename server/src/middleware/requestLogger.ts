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
 * Handles both regular and streaming (SSE) responses.
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const chunks: any[] = [];
  let isStreaming = false;

  // Store original response methods.  Using 'any' is generally discouraged, but necessary here
  // to work around type conflicts when overriding Express's methods.  The methods are still
  // correctly typed within this middleware's scope.
  const originalSend: any = res.send;
  const originalJson: any = res.json;
  const originalWrite: any = res.write;
  const originalEnd: any = res.end;

  // Override response methods to capture the response body.

  res.send = function (body: any): Response {
    // Capture the body for non-streaming responses.
    if (!isStreaming) {
        chunks.push(body);
    }
    return originalSend.call(res, body); // Use .call for correct 'this' context.
  };

  res.json = function (body: any): Response {
      // Capture the body for non-streaming responses.
      if (!isStreaming) {
          chunks.push(body);
      }
    return originalJson.call(res, body);  // Use .call for correct 'this' context.
  };

  // Handle streaming (Server-Sent Events) responses.
  res.write = function (chunk: any, encodingOrCallback?: BufferEncoding | ((error: Error | null | undefined) => void), cb?: (error: Error | null | undefined) => void): boolean {
    if (chunk) {
      const strChunk = typeof chunk === 'string' ? chunk : chunk.toString();
      // Only collect data: prefixed chunks for SSE.  This is a more robust check.
      if (strChunk.startsWith('data: ')) {
        isStreaming = true;
        const cleanChunk = strChunk.substring(6).trim(); // More efficient substring.
        if (cleanChunk !== '[DONE]') {
          try {
            // Attempt to parse as JSON, only storing if it has a delta.content.
            const jsonChunk = JSON.parse(cleanChunk);
            if (jsonChunk?.delta?.content) {
              chunks.push(jsonChunk.delta.content); // Directly store the content.
            }
          } catch (e) {
            // If parsing fails (not valid JSON), we ignore it.  This is expected
            // for the [DONE] message and any other non-JSON data.
          }
        }
      }
    }
    // Handle the overloaded signature cases
    if (typeof encodingOrCallback === 'function') {
      return originalWrite.call(res, chunk, encodingOrCallback);
    }
    return originalWrite.call(res, chunk, encodingOrCallback, cb);
  };


  res.end = function (chunk?: any, encodingOrCallback?: BufferEncoding | (() => void), cb?: () => void): Response {
    // Capture any final chunk, handling different argument combinations.
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
                } catch (e) {
                    // Ignore parsing errors; not all chunks are JSON
                }
            }
        }
    }

    // No need for nextTick; res.end *should* be the final call.
    const duration = Date.now() - start;
    const responseBody = isStreaming ? chunks.join('') : (chunks.length > 0 ? chunks[0] : undefined); //join chunks for stream
    logRequest(req, res, duration, responseBody);
    
    if (typeof encodingOrCallback === 'function') {
      return originalEnd.call(res, chunk, encodingOrCallback);
    }
    return originalEnd.call(res, chunk, encodingOrCallback, cb);
  };

  next();
};