import { ReadableStream } from 'web-streams-polyfill';

// Add ReadableStream to the global scope if it doesn't exist
if (typeof global.ReadableStream === 'undefined') {
  (global as any).ReadableStream = ReadableStream;
} 