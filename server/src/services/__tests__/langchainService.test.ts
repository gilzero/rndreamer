/// <reference types="jest" />

/**
 * @fileoverview Test suite for the LangChainService class.
 * @filepath src/services/__tests__/langchainService.test.ts
 * 
 * This file contains unit tests for the LangChainService class,
 * which provides a unified interface for interacting with OpenAI (GPT),
 * Anthropic (Claude), and Google (Gemini) AI models through the LangChain framework.
 * 
 * @how-to-run:
 * npx jest src/services/__tests__/langchainService.test.ts
 * @module services/__tests__/langchainService.test
 * @requires ../langchainService
 * @requires @langchain/openai
 * @requires @langchain/anthropic
 * @requires @langchain/google-genai
 * @requires @langchain/core/messages
 */

import { LangChainService } from '../langchainService';
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Response } from 'express';
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";

// Mock the environment variables
process.env['OPENAI_API_KEY'] = 'test-openai-key';
process.env['ANTHROPIC_API_KEY'] = 'test-anthropic-key';
process.env['GEMINI_API_KEY'] = 'test-gemini-key';
process.env['OPENAI_MODEL_DEFAULT'] = 'test-gpt-default';
process.env['OPENAI_MODEL_FALLBACK'] = 'test-gpt-fallback';
process.env['ANTHROPIC_MODEL_DEFAULT'] = 'test-claude-default';
process.env['ANTHROPIC_MODEL_FALLBACK'] = 'test-claude-fallback';
process.env['GEMINI_MODEL_DEFAULT'] = 'test-gemini-default';
process.env['GEMINI_MODEL_FALLBACK'] = 'test-gemini-fallback';

// Mock the LangChain models
jest.mock('@langchain/openai');
jest.mock('@langchain/anthropic');
jest.mock('@langchain/google-genai');

// Mock Express Response
const mockResponse = () => {
  const res: Partial<Response> = {
    write: jest.fn(),
    end: jest.fn(),
  };
  return res as Response;
};

describe('LangChainService', () => {
  let service: LangChainService;

  beforeEach(() => {
    service = new LangChainService();
    jest.clearAllMocks();
  });

  describe('Message Validation', () => {
    test('should throw error for empty messages array', async () => {
      await expect(
        service.chat([], { provider: 'gpt' })
      ).rejects.toThrow('No messages provided');
    });

    test('should throw error for empty message content', async () => {
      await expect(
        service.chat([{ role: 'user', content: '' }], { provider: 'gpt' })
      ).rejects.toThrow('Empty message content');
    });

    test('should throw error for invalid message role', async () => {
      await expect(
        service.chat([{ role: 'invalid' as any, content: 'test' }], { provider: 'gpt' })
      ).rejects.toThrow('Invalid message role');
    });

    test('should accept valid messages with all allowed roles', async () => {
      const messages = [
        { role: 'system' as const, content: 'system message' },
        { role: 'user' as const, content: 'user message' },
        { role: 'assistant' as const, content: 'assistant message' }
      ];
      
      // Mock successful model response
      ((ChatOpenAI as unknown) as jest.Mock).mockImplementationOnce(() => ({
        invoke: jest.fn().mockResolvedValue({ content: 'response' })
      }));

      await expect(
        service.chat(messages, { provider: 'gpt' })
      ).resolves.not.toThrow();
    });
  });

  describe('Message Conversion', () => {
    const messages = [
      { role: 'system' as const, content: 'system message' },
      { role: 'user' as const, content: 'user message' },
      { role: 'assistant' as const, content: 'assistant message' }
    ];

    test('should convert messages to correct LangChain message types', async () => {
      // Mock successful model response
      ((ChatOpenAI as unknown) as jest.Mock).mockImplementationOnce(() => ({
        invoke: jest.fn().mockImplementation(async (messages) => {
          // Verify message types
          expect(messages[0]).toBeInstanceOf(SystemMessage);
          expect(messages[1]).toBeInstanceOf(HumanMessage);
          expect(messages[2]).toBeInstanceOf(AIMessage);
          return { content: 'response' };
        })
      }));

      await service.chat(messages, { provider: 'gpt' });
    });
  });

  describe('Model Fallback Logic', () => {
    const testMessages = [
      { role: 'user' as const, content: 'Hello' }
    ];

    test('should use default GPT model when no specific model is provided', async () => {
      await service.chat(testMessages, { provider: 'gpt' });
      expect(ChatOpenAI).toHaveBeenCalledWith(
        expect.objectContaining({
          modelName: process.env['OPENAI_MODEL_DEFAULT'] || 'gpt-4o'
        })
      );
    });

    test('should use fallback GPT model when specified', async () => {
      await service.chat(testMessages, { 
        provider: 'gpt',
        model: process.env['OPENAI_MODEL_FALLBACK'] || 'gpt-4o-mini'
      });
      expect(ChatOpenAI).toHaveBeenCalledWith(
        expect.objectContaining({
          modelName: process.env['OPENAI_MODEL_FALLBACK'] || 'gpt-4o-mini'
        })
      );
    });

    test('should use default Claude model when no specific model is provided', async () => {
      await service.chat(testMessages, { provider: 'claude' });
      expect(ChatAnthropic).toHaveBeenCalledWith(
        expect.objectContaining({
          modelName: process.env['ANTHROPIC_MODEL_DEFAULT'] || 'claude-3-5-sonnet-latest'
        })
      );
    });

    test('should use fallback Claude model when specified', async () => {
      await service.chat(testMessages, {
        provider: 'claude',
        model: process.env['ANTHROPIC_MODEL_FALLBACK'] || 'claude-3-5-haiku-latest'
      });
      expect(ChatAnthropic).toHaveBeenCalledWith(
        expect.objectContaining({
          modelName: process.env['ANTHROPIC_MODEL_FALLBACK'] || 'claude-3-5-haiku-latest'
        })
      );
    });

    test('should use default Gemini model when no specific model is provided', async () => {
      await service.chat(testMessages, { provider: 'gemini' });
      expect(ChatGoogleGenerativeAI).toHaveBeenCalledWith(
        expect.objectContaining({
          modelName: process.env['GEMINI_MODEL_DEFAULT'] || 'gemini-2.0-flash'
        })
      );
    });

    test('should use fallback Gemini model when specified', async () => {
      await service.chat(testMessages, {
        provider: 'gemini',
        model: process.env['GEMINI_MODEL_FALLBACK'] || 'gemini-1.5-pro'
      });
      expect(ChatGoogleGenerativeAI).toHaveBeenCalledWith(
        expect.objectContaining({
          modelName: process.env['GEMINI_MODEL_FALLBACK'] || 'gemini-1.5-pro'
        })
      );
    });

    test('should throw error for unsupported model', async () => {
      await expect(
        service.chat(testMessages, {
          provider: 'gpt',
          model: 'unsupported-model'
        })
      ).rejects.toThrow('Unsupported model');
    });
  });

  describe('API Key Handling', () => {
    const testMessages = [{ role: 'user' as const, content: 'Hello' }];

    test('should handle missing OpenAI API key', async () => {
      const originalKey = process.env['OPENAI_API_KEY'];
      process.env['OPENAI_API_KEY'] = '';

      await expect(
        service.chat(testMessages, { provider: 'gpt' })
      ).rejects.toThrow('OpenAI API key not configured');

      process.env['OPENAI_API_KEY'] = originalKey;
    });

    test('should handle missing Anthropic API key', async () => {
      const originalKey = process.env['ANTHROPIC_API_KEY'];
      process.env['ANTHROPIC_API_KEY'] = '';

      await expect(
        service.chat(testMessages, { provider: 'claude' })
      ).rejects.toThrow('Anthropic API key not configured');

      process.env['ANTHROPIC_API_KEY'] = originalKey;
    });

    test('should handle missing Gemini API key', async () => {
      const originalKey = process.env['GEMINI_API_KEY'];
      process.env['GEMINI_API_KEY'] = '';

      await expect(
        service.chat(testMessages, { provider: 'gemini' })
      ).rejects.toThrow('Gemini API key not configured');

      process.env['GEMINI_API_KEY'] = originalKey;
    });
  });

  describe('Streaming Functionality', () => {
    const testMessages = [{ role: 'user' as const, content: 'Hello' }];
    
    test('should handle successful streaming', async () => {
      const res = mockResponse();
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          yield { content: 'Hello' };
          yield { content: ' World' };
        }
      };

      ((ChatOpenAI as unknown) as jest.Mock).mockImplementationOnce(() => ({
        stream: jest.fn().mockResolvedValue(mockStream)
      }));

      await service.streamChat(testMessages, { provider: 'gpt' }, res);

      expect(res.write).toHaveBeenCalledTimes(3); // 2 content chunks + [DONE]
      expect(res.end).toHaveBeenCalled();
    });

    test('should handle stream timeout', async () => {
      const res = mockResponse();
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          await new Promise(resolve => setTimeout(resolve, 31000)); // Longer than default timeout
          yield { content: 'Too late' };
        }
      };

      ((ChatOpenAI as unknown) as jest.Mock).mockImplementationOnce(() => ({
        stream: jest.fn().mockResolvedValue(mockStream)
      }));

      await service.streamChat(testMessages, { provider: 'gpt' }, res);

      expect(res.write).toHaveBeenCalledWith(
        expect.stringContaining('Stream timeout')
      );
      expect(res.end).toHaveBeenCalled();
    });

    test('should handle connection reset', async () => {
      const res = mockResponse();
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          throw new Error('ECONNRESET');
        }
      };

      ((ChatOpenAI as unknown) as jest.Mock).mockImplementationOnce(() => ({
        stream: jest.fn().mockResolvedValue(mockStream)
      }));

      await service.streamChat(testMessages, { provider: 'gpt' }, res);

      expect(res.write).toHaveBeenCalledWith(
        expect.stringContaining('Connection reset')
      );
      expect(res.end).toHaveBeenCalled();
    });

    test('should handle rate limit errors', async () => {
      const res = mockResponse();
      const mockStream = {
        async *[Symbol.asyncIterator]() {
          throw new Error('rate limit exceeded');
        }
      };

      ((ChatOpenAI as unknown) as jest.Mock).mockImplementationOnce(() => ({
        stream: jest.fn().mockResolvedValue(mockStream)
      }));

      await service.streamChat(testMessages, { provider: 'gpt' }, res);

      expect(res.write).toHaveBeenCalledWith(
        expect.stringContaining('Rate limit exceeded')
      );
      expect(res.end).toHaveBeenCalled();
    });
  });
}); 