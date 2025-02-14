import { Request, Response, NextFunction } from "express"
import asyncHandler from 'express-async-handler'
import { langchainService } from '../services/langchainService'

type ModelName = 'gpt-4o' | 'gpt-4o-mini';

const models: Record<string, ModelName> = {
  gpt: 'gpt-4o',
  gptTurbo: 'gpt-4o-mini'
}

interface RequestBody {
  messages: Array<{ role: string; content: string }>;
  model: string;
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

    await langchainService.streamChat(messages, {
      provider: 'gpt',
      model
    }, res)
  } catch (err) {
    console.error('Error in GPT chat:', err)
    res.write('data: [DONE]\n\n')
    res.end()
  }
})