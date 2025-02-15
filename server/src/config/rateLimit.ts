/**
 * @fileoverview Rate limiting configuration for chat endpoints.
 * Provides different rate limits for different AI providers and endpoints.
 * 
 * This module configures rate limiting for the chat API to:
 * - Prevent API abuse and ensure fair usage
 * - Apply provider-specific limits (GPT, Claude, Gemini)
 * - Provide clear error messages when limits are exceeded
 * 
 * @module rateLimit
 * @requires express-rate-limit
 * 
 * @example
 * // Using rate limiters in an Express route
 * import { gptLimiter } from './config/rateLimit';
 * router.post('/chat/gpt', gptLimiter, handleGPTChat);
 */

import rateLimit from 'express-rate-limit';

/**
 * Configuration constants for rate limiting.
 * All values can be overridden through environment variables.
 * 
 * @constant
 * @type {Readonly<{
 *   WINDOW_MS: number,
 *   MAX_REQUESTS: number,
 *   GPT_MAX: number,
 *   CLAUDE_MAX: number,
 *   GEMINI_MAX: number
 * }>}
 * 
 * @property {number} WINDOW_MS - Time window for rate limiting (default: 1 hour)
 * @property {number} MAX_REQUESTS - Maximum total requests per window (default: 500)
 * @property {number} GPT_MAX - Maximum GPT requests per window (default: 200)
 * @property {number} CLAUDE_MAX - Maximum Claude requests per window (default: 200)
 * @property {number} GEMINI_MAX - Maximum Gemini requests per window (default: 200)
 */
export const RATE_LIMITS = {
  WINDOW_MS: Number(process.env['RATE_LIMIT_WINDOW_MS'] || 60 * 60 * 1000),  // 1 hour
  MAX_REQUESTS: Number(process.env['RATE_LIMIT_MAX_REQUESTS'] || 500),        // 500 total requests per hour
  GPT_MAX: Number(process.env['GPT_RATE_LIMIT_MAX'] || 200),                 // 200 GPT requests per hour
  CLAUDE_MAX: Number(process.env['CLAUDE_RATE_LIMIT_MAX'] || 200),           // 200 Claude requests per hour
  GEMINI_MAX: Number(process.env['GEMINI_RATE_LIMIT_MAX'] || 200),           // 200 Gemini requests per hour
} as const;

/**
 * Base rate limiter configuration shared by all limiters.
 * Provides common settings and default error message format.
 * 
 * @type {object}
 * @property {number} windowMs - Time window in milliseconds
 * @property {boolean} standardHeaders - Enable standard rate limit headers
 * @property {boolean} legacyHeaders - Disable legacy rate limit headers
 * @property {object} message - Error response format
 */
const baseLimiter = {
  windowMs: RATE_LIMITS.WINDOW_MS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  }
};

/**
 * General API rate limiter applied to all chat endpoints.
 * Enforces overall request limits regardless of provider.
 * 
 * @type {RateLimit}
 * @example
 * app.use('/api', apiLimiter);
 */
export const apiLimiter = rateLimit({
  ...baseLimiter,
  max: RATE_LIMITS.MAX_REQUESTS,
});

/**
 * GPT-specific rate limiter for OpenAI endpoints.
 * Enforces stricter limits for GPT model usage.
 * 
 * @type {RateLimit}
 * @example
 * router.post('/chat/gpt', gptLimiter, handleGPTChat);
 */
export const gptLimiter = rateLimit({
  ...baseLimiter,
  max: RATE_LIMITS.GPT_MAX,
  message: {
    error: 'GPT request limit exceeded, please try again later.',
    code: 'GPT_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * Claude-specific rate limiter for Anthropic endpoints.
 * Enforces stricter limits for Claude model usage.
 * 
 * @type {RateLimit}
 * @example
 * router.post('/chat/claude', claudeLimiter, handleClaudeChat);
 */
export const claudeLimiter = rateLimit({
  ...baseLimiter,
  max: RATE_LIMITS.CLAUDE_MAX,
  message: {
    error: 'Claude request limit exceeded, please try again later.',
    code: 'CLAUDE_RATE_LIMIT_EXCEEDED'
  }
});

/**
 * Gemini-specific rate limiter for Google AI endpoints.
 * Enforces stricter limits for Gemini model usage.
 * 
 * @type {RateLimit}
 * @example
 * router.post('/chat/gemini', geminiLimiter, handleGeminiChat);
 */
export const geminiLimiter = rateLimit({
  ...baseLimiter,
  max: RATE_LIMITS.GEMINI_MAX,
  message: {
    error: 'Gemini request limit exceeded, please try again later.',
    code: 'GEMINI_RATE_LIMIT_EXCEEDED'
  }
}); 