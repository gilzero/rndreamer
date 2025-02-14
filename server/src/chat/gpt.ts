import { Request, Response, NextFunction } from "express"
import asyncHandler from 'express-async-handler'
import { langchainService } from '../services/langchainService'

// Use exact model names from environment
type ModelName = string;
type MessageRole = 'user' | 'assistant' | 'system';

interface RequestBody {
  messages: Array<{ role: MessageRole; content: string }>;
  model?: ModelName;  // Make model optional
}

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