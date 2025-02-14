import { Request, Response } from "express";
import asyncHandler from 'express-async-handler';
import { langchainService } from '../services/langchainService';

// Use exact model names from environment
type ModelName = string;

interface RequestBody {
  messages: any[];
  model?: ModelName;  // Make model optional
}

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

export async function streamToStdout(stream :any, res: Response) {
  for await (const chunk of stream) {
    const chunkText = chunk.text()
    res.write(`data: ${JSON.stringify(chunkText)}\n\n`)
  }
  res.write('data: [DONE]\n\n')
  res.end()
}