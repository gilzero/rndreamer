import { ChatGoogleGenerativeAI } from "@langchain/google-genai"
import { Request, Response } from "express"

export async function gemini(req: Request, res: Response) {
  try {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    })
    const { prompt } = req.body
    if (!prompt) {
      return res.json({
        error: 'no prompt'
      })
    }

    const model = new ChatGoogleGenerativeAI({
      modelName: "gemini-2.0-flash",
      apiKey: process.env.GEMINI_API_KEY,
      streaming: true,
    })

    const stream = await model.stream(prompt)

    for await (const chunk of stream) {
      if (chunk.content) {
        res.write(`data: ${JSON.stringify(chunk.content)}\n\n`)
      }
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (err) {
    console.log('error in Gemini chat: ', err)
    res.write('data: [DONE]\n\n')
    res.end()
  }
}

export async function streamToStdout(stream :any, res: Response) {
  for await (const chunk of stream) {
    const chunkText = chunk.text()
    res.write(`data: ${JSON.stringify(chunkText)}\n\n`)
  }
  res.write('data: [DONE]\n\n')
  res.end()
}