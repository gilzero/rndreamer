/**
 * @fileoverview Rate limiting configuration for chat endpoints.
 * 
 * @filepath src/config/rateLimit.ts
 * 
 * Provides different rate limits for different AI providers and endpoints.
 * This module configures rate limiting for the chat API to:
 * - Prevent API abuse and ensure fair usage
 * - Apply provider-specific limits (GPT, Claude, Gemini)
 * - Provide clear error messages when limits are exceeded
 *
 * @module config/rateLimit
 * @requires express-rate-limit
 * 
 * @example
 * // Using rate limiters in an Express route
 * import { gptLimiter } from './config/rateLimit';
 * router.post('/chat/gpt', gptLimiter, handleGPTChat);
 */

import rateLimit, { Options } from 'express-rate-limit';
import { Request } from 'express';

type RateLimitConfig = {
  WINDOW_MS: number;
  MAX_REQUESTS: number;
  GPT_MAX: number;
  CLAUDE_MAX: number;
  GEMINI_MAX: number;
};

export const RATE_LIMITS: Readonly<RateLimitConfig> = {
  WINDOW_MS: Number(process.env['RATE_LIMIT_WINDOW_MS'] || 60 * 60 * 1000),  // 1 hour
  MAX_REQUESTS: Number(process.env['RATE_LIMIT_MAX_REQUESTS'] || 500),        // 500 total requests per hour
  GPT_MAX: Number(process.env['GPT_RATE_LIMIT_MAX'] || 200),                 // 200 GPT requests per hour
  CLAUDE_MAX: Number(process.env['CLAUDE_RATE_LIMIT_MAX'] || 200),           // 200 Claude requests per hour
  GEMINI_MAX: Number(process.env['GEMINI_RATE_LIMIT_MAX'] || 200),           // 200 Gemini requests per hour
} as const;

const getProviderFromUrl = (url: string): string => {
    const providers = ['gpt', 'claude', 'gemini'];
    const match = providers.find(p => url.toLowerCase().includes(p));
    return match ? match.charAt(0).toUpperCase() + match.slice(1) : 'API';
};

const baseLimiter: Partial<Options> = {
    windowMs: RATE_LIMITS.WINDOW_MS,
    standardHeaders: true,
    legacyHeaders: false,
    message: (req: Request) => {
        const provider = getProviderFromUrl(req.originalUrl);
        return {
            error: `${provider} request limit exceeded, please try again later.`,
            code: `${provider.toUpperCase()}_RATE_LIMIT_EXCEEDED`
        };
    }
};

/**
 * General API rate limiter applied to all chat endpoints.
 * Enforces overall request limits regardless of provider.
 * 
 * @example
 * app.use('/api', apiLimiter);
 */
export const apiLimiter = rateLimit({
  ...baseLimiter,
  max: RATE_LIMITS.MAX_REQUESTS,
});

/**
 * Creates a provider-specific rate limiter with custom limits and messages
 */
const createProviderLimiter = (maxRequests: number) => rateLimit({
    ...baseLimiter,
    max: maxRequests
});

export const gptLimiter = createProviderLimiter(RATE_LIMITS.GPT_MAX);
export const claudeLimiter = createProviderLimiter(RATE_LIMITS.CLAUDE_MAX);
export const geminiLimiter = createProviderLimiter(RATE_LIMITS.GEMINI_MAX); 