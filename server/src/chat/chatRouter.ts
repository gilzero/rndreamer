/**
 * @fileoverview Express router for handling chat-related endpoints.
 * Provides routes for different AI chat providers (GPT, Claude, Gemini).
 * Includes middleware for message validation and error handling.
 * 
 * @module chatRouter
 * @requires express
 * @requires ./gpt
 * @requires ./claude
 * @requires ./gemini
 * @requires ../config/validation
 * @requires ../config/rateLimit
 */

import { Router } from 'express'
import { gpt } from './gpt'
import { claude } from './claude'
import { gemini } from './gemini'
import { validateMessages } from '../config/validation'
import { apiLimiter, gptLimiter, claudeLimiter, geminiLimiter } from '../config/rateLimit'

const router = Router()

// Apply general rate limiting to all chat routes
router.use(apiLimiter)

/**
 * Middleware to validate incoming chat messages.
 * Checks for:
 * - Presence of messages array
 * - Valid message format
 * - Message content constraints
 */
router.use((req, res, next) => {
  const { messages } = req.body;
  
  if (!messages || !Array.isArray(messages)) {
    res.status(400).json({
      error: 'Invalid messages format'
    });
    return;
  }

  const validationError = validateMessages(messages);
  if (validationError) {
    res.status(400).json({
      error: validationError.message,
      code: validationError.code
    });
    return;
  }

  next();
});

// Apply provider-specific rate limits to each route
router.post('/gpt', gptLimiter, gpt)
router.post('/claude', claudeLimiter, claude)
router.post('/gemini', geminiLimiter, gemini)

export default router