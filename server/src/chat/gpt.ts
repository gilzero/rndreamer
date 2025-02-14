/**
 * @fileoverview GPT chat endpoint handler implementation.
 * Provides streaming chat completion functionality using OpenAI's GPT models.
 * 
 * @module gpt
 * @requires express
 * @requires express-async-handler
 * @requires ../services/langchainService
 */

import { Request, Response, NextFunction } from "express"
import asyncHandler from 'express-async-handler'
import { langchainService } from '../services/langchainService'

/** Type representing valid model names from environment configuration */
type ModelName = string;

/** Type representing valid message roles in the chat context */
type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Interface for the expected request body structure
 * @interface RequestBody
 */
interface RequestBody {
  /** Array of chat messages with role and content */
  messages: Array<{ role: MessageRole; content: string }>;
  /** Optional model identifier - falls back to default if not provided */
  model?: ModelName;
}

/**
 * Express handler for GPT chat completions.
 * Sets up SSE connection and streams chat completion responses.
 * 
 * @param req - Express request object containing chat messages and optional model
 * @param res - Express response object for streaming
 * @param next - Express next function
 * @throws {Error} If message validation fails or chat completion errors occur
 */
export const gpt = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    })

    const { messages, model }: RequestBody = req.body
    if (!messages || !messages.length) {
      res.json({
        error: 'no messages'
      })
      return
    }

    // If no model specified, let langchainService use the default from env
    await langchainService.streamChat(messages, {
      provider: 'gpt',
      ...(model && { model })  // Only include model if it's provided
    }, res)
  } catch (err) {
    console.error('Error in GPT chat:', err)
    res.write('data: [DONE]\n\n')
    res.end()
  }
})