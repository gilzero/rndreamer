/**
 * @fileoverview Polyfills for React Native environment compatibility.
 * Provides necessary web platform features that are not natively available in React Native.
 * 
 * This file ensures that streaming functionality works correctly in the React Native environment
 * by providing the ReadableStream API, which is used for server-sent events (SSE) in the chat service.
 * 
 * @see {@link ../services/chatService.ts} for streaming implementation
 * @see {@link ../screens/chat.tsx} for stream handling in the UI
 */

import { ReadableStream } from 'web-streams-polyfill';

/**
 * Adds ReadableStream to the global scope if not already present.
 * This polyfill is required for streaming functionality in the chat service,
 * as React Native's environment doesn't include the Web Streams API by default.
 * 
 * Implementation Notes:
 * - Only applies if ReadableStream is undefined in global scope
 * - Uses web-streams-polyfill package for compatibility
 * - Required for EventSource streaming in chat service
 * 
 * Error Handling:
 * - If polyfill fails to load, streaming functionality will be unavailable
 * - Chat service should fall back to non-streaming mode
 * 
 * @see {@link ../services/chatService.ts} for streaming usage
 */
if (typeof global.ReadableStream === 'undefined') {
  (global as any).ReadableStream = ReadableStream;
} 