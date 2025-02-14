import { Request, Response, NextFunction } from "express"
import asyncHandler from 'express-async-handler'
import { langchainService } from '../services/langchainService'

type ModelName = 'claude-3-5-sonnet-latest' | 'claude-3-5-haiku-latest';

const models: Record<string, ModelName> = {
  claude: 'claude-3-5-sonnet-latest',
  claudeInstant: 'claude-3-5-haiku-latest'
}

interface RequestBody {
  messages: any[];
  model: ModelName;
}

export const claude = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
      provider: 'claude',
      model
    }, res)
  } catch (err) {
    console.error('Error in Claude chat:', err)
    res.write('data: [DONE]\n\n')
    res.end()
  }
})