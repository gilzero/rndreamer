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
 */

import { Router } from 'express'
import { gpt } from './gpt'
import { claude } from './claude'
import { gemini } from './gemini'
import { validateMessages } from '../config/validation'

const router = Router()

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

router.post('/gpt', gpt)
router.post('/claude', claude)
router.post('/gemini', gemini)

export default router