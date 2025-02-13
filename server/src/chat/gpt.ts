import { Request, Response, NextFunction } from "express"
import asyncHandler from 'express-async-handler'
import { ChatOpenAI } from "@langchain/openai"

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

    const { model, messages }: RequestBody = req.body
    if (!messages || !messages.length) {
      res.json({
        error: 'no messages'
      })
      return
    }

    const chat = new ChatOpenAI({
      modelName: models[model],
      openAIApiKey: process.env.OPENAI_API_KEY,
      streaming: true,
    })

    const stream = await chat.stream(messages)

    for await (const chunk of stream) {
      if (chunk.content) {
        res.write(`data: ${JSON.stringify({ delta: { content: chunk.content } })}\n\n`)
      }
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (err) {
    console.log('error in gpt chat: ', err)
    res.write('data: [DONE]\n\n')
    res.end()
  }
})