/**
 * @fileoverview Rate limiting configuration for chat endpoints.
 * Provides different rate limits for different AI providers and endpoints.
 * 
 * @module rateLimit
 * @requires express-rate-limit
 */

import rateLimit from 'express-rate-limit';

/**
 * Configuration constants for rate limiting
 * Values can be overridden through environment variables
 */
export const RATE_LIMITS = {
  WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS || 60 * 60 * 1000),  // 1 hour
  MAX_REQUESTS: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 500),        // 500 total requests per hour
  GPT_MAX: Number(process.env.GPT_RATE_LIMIT_MAX || 200),                 // 200 GPT requests per hour
  CLAUDE_MAX: Number(process.env.CLAUDE_RATE_LIMIT_MAX || 200),           // 200 Claude requests per hour
  GEMINI_MAX: Number(process.env.GEMINI_RATE_LIMIT_MAX || 200),           // 200 Gemini requests per hour
} as const;

/**
 * Base rate limiter configuration
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
 * General API rate limiter
 * Applies to all chat endpoints
 */
export const apiLimiter = rateLimit({
  ...baseLimiter,
  max: RATE_LIMITS.MAX_REQUESTS,
});

/**
 * GPT-specific rate limiter
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
 * Claude-specific rate limiter
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
 * Gemini-specific rate limiter
 */
export const geminiLimiter = rateLimit({
  ...baseLimiter,
  max: RATE_LIMITS.GEMINI_MAX,
  message: {
    error: 'Gemini request limit exceeded, please try again later.',
    code: 'GEMINI_RATE_LIMIT_EXCEEDED'
  }
}); 