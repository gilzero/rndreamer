/**
 * @fileoverview Main application entry point.
 * @filepath src/index.ts
 * Sets up Express server with middleware and routes.
 * 
 * @module index
 * @requires express
 * @requires ./chat/chatService
 * @requires body-parser
 * @requires dotenv/config
 */

import express from 'express'
import chatRouter, { chatService } from './chat/chatService'
import bodyParser from 'body-parser'
import 'dotenv/config'
import { requestLogger } from './middleware/requestLogger'
import { ChatProvider, ChatMessage } from './chat/types'
import logger, { logAIRequest, logError } from './config/logger'

const app = express()

// Configure middleware
app.use(requestLogger) // Add request logging middleware
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(express.json({limit: '50mb'}))

/**
 * Main health check endpoint
 * @route GET /health
 * @returns {object} Overall system health status
 */
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    service: 'ai-chat-app'
  });
});

/**
 * GPT service health check endpoint
 * @route GET /health/gpt
 * @returns {object} Status of GPT service
 */
app.get('/health/gpt', async (_req, res) => {
  const start = Date.now();
  try {
    const messages: ChatMessage[] = [{ role: 'user' as const, content: 'ping' }];
    await chatService.chat(messages, { provider: ChatProvider.GPT });
    const duration = Date.now() - start;
    logAIRequest('gpt', duration, true);
    res.status(200).json({ status: 'OK', provider: 'gpt' });
  } catch (error: any) {
    const duration = Date.now() - start;
    logAIRequest('gpt', duration, false, error);
    res.status(503).json({ 
      status: 'ERROR', 
      provider: 'gpt', 
      message: error.message 
    });
  }
});

/**
 * Claude service health check endpoint
 * @route GET /health/claude
 * @returns {object} Status of Claude service
 */
app.get('/health/claude', async (_req, res) => {
  const start = Date.now();
  try {
    const messages: ChatMessage[] = [{ role: 'user' as const, content: 'ping' }];
    await chatService.chat(messages, { provider: ChatProvider.CLAUDE });
    const duration = Date.now() - start;
    logAIRequest('claude', duration, true);
    res.status(200).json({ status: 'OK', provider: 'claude' });
  } catch (error: any) {
    const duration = Date.now() - start;
    logAIRequest('claude', duration, false, error);
    res.status(503).json({ 
      status: 'ERROR', 
      provider: 'claude', 
      message: error.message 
    });
  }
});

/**
 * Gemini service health check endpoint
 * @route GET /health/gemini
 * @returns {object} Status of Gemini service
 */
app.get('/health/gemini', async (_req, res) => {
  const start = Date.now();
  try {
    const messages: ChatMessage[] = [{ role: 'user' as const, content: 'ping' }];
    await chatService.chat(messages, { provider: ChatProvider.GEMINI });
    const duration = Date.now() - start;
    logAIRequest('gemini', duration, true);
    res.status(200).json({ status: 'OK', provider: 'gemini' });
  } catch (error: any) {
    const duration = Date.now() - start;
    logAIRequest('gemini', duration, false, error);
    res.status(503).json({ 
      status: 'ERROR', 
      provider: 'gemini', 
      message: error.message 
    });
  }
});

/**
 * Health check endpoint
 * @route GET /
 * @returns {string} Simple health check message
 */
app.get('/', (_req, res) => {
  res.send('Hello World!')
})

// Mount chat routes
app.use('/chat', chatRouter)

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response) => {
  logError(err, { path: req.path, method: req.method });
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
const port = process.env['PORT'] || 3050;
app.listen(port, () => {
  logger.info(`Server started on port ${port}`, {
    environment: process.env['NODE_ENV']
  });
});
