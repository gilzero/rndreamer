/**
 * @fileoverview Gemini chat endpoint handler implementation.
 * @filepath src/chat/gemini.ts
 * Provides streaming chat completion functionality using Google's Gemini models.
 * 
 * @module gemini
 * @requires express
 * @requires express-async-handler
 * @requires ../services/langchainService
 */

import { Request, Response } from "express";
import asyncHandler from 'express-async-handler';
import { langchainService } from '../services/langchainService';

/** Type representing valid model names from environment configuration */
type ModelName = string;

/**
 * Interface for the expected request body structure
 * @interface RequestBody
 */
interface RequestBody {
  /** Array of chat messages with role and content */
  messages: any[];
  /** Optional model identifier - falls back to default if not provided */
  model?: ModelName;
}

/**
 * Express handler for Gemini chat completions.
 * Sets up SSE connection and streams chat completion responses.
 * 
 * @param req - Express request object containing chat messages and optional model
 * @param res - Express response object for streaming
 * @throws {Error} If message validation fails or chat completion errors occur
 */
export const gemini = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    });

    const { messages, model }: RequestBody = req.body;
    if (!messages || !messages.length) {
      res.json({
        error: 'no messages'
      });
      return;
    }

    // If no model specified, let langchainService use the default from env
    await langchainService.streamChat(messages, {
      provider: 'gemini',
      ...(model && { model })  // Only include model if it's provided
    }, res);
  } catch (err) {
    console.error('Error in Gemini chat:', err);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

/**
 * Utility function to stream model output to stdout.
 * Formats and writes chunks as SSE events.
 * 
 * @param stream - The stream to process
 * @param res - Express response object for streaming
 */
export async function streamToStdout(stream :any, res: Response) {
  for await (const chunk of stream) {
    const chunkText = chunk.text()
    res.write(`data: ${JSON.stringify(chunkText)}\n\n`)
  }
  res.write('data: [DONE]\n\n')
  res.end()
}