import { Request, Response, NextFunction } from "express"
import asyncHandler from 'express-async-handler'
import { ChatAnthropic } from "@langchain/anthropic"

type ModelName = 'claude-3-5-sonnet-latest' | 'claude-3-5-haiku-latest';

const models: Record<string, ModelName> = {
  claude: 'claude-3-5-sonnet-latest',
  claudeInstant: 'claude-3-5-haiku-latest'
}

interface RequestBody {
  prompt: any;
  model: ModelName;
}

export const claude = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    })

    const { prompt, model }: RequestBody = req.body
    if (!prompt) {
      res.json({
        error: 'no prompt'
      })
      return
    }

    const chat = new ChatAnthropic({
      modelName: models[model],
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
      streaming: true,
    })

    const stream = await chat.stream(prompt)

    for await (const chunk of stream) {
      if (chunk.content) {
        res.write(`data: ${JSON.stringify({ delta: { text: chunk.content } })}\n\n`)
      }
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (err) {
    console.log('error in claude chat: ', err)
    res.write('data: [DONE]\n\n')
    res.end()
  }
})