import { describe, it, expect, beforeEach, vi } from 'vitest';
import GeminiService from './gemini-api.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Mock the GoogleGenerativeAI module
vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: vi.fn(() => ({
      getGenerativeModel: vi.fn(() => ({
        generateContent: vi.fn(),
        generateContentStream: vi.fn(),
      })),
      apiKey: 'mock-api-key',
      getGenerativeModelFromCachedContent: vi.fn()
    })),
  };
});

describe('GeminiService', () => {
  const API_KEY = 'test-api-key';
  const MODEL_NAME = 'gemini-2.0-flash-lite-001';
  
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
    
    // Reset the singleton instance
    // @ts-expect-error: Accessing private static field for testing
    GeminiService.instance = null;
  });
  
  describe('getInstance', () => {
    it('should create a new instance if none exists', () => {
      const instance = GeminiService.getInstance(API_KEY, MODEL_NAME);
      expect(instance).toBeInstanceOf(GeminiService);
      expect(GoogleGenerativeAI).toHaveBeenCalledWith(API_KEY);
    });
    
    it('should return the existing instance if one exists', () => {
      const instance1 = GeminiService.getInstance(API_KEY, MODEL_NAME);
      const instance2 = GeminiService.getInstance(API_KEY, MODEL_NAME);
      expect(instance1).toBe(instance2);
      expect(GoogleGenerativeAI).toHaveBeenCalledTimes(1);
    });
    
    it('should throw an error if API key is not provided', () => {
      expect(() => GeminiService.getInstance('', MODEL_NAME)).toThrowError('Gemini API Key is required.');
    });
  });
  
  describe('sendMessage', () => {
    it('should send a message and return the response text', async () => {
      // Setup mock implementation for this specific test
      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: {
          text: () => 'Mock response text'
        }
      });
      
      const mockGetGenerativeModel = vi.fn().mockReturnValue({
        generateContent: mockGenerateContent,
        generateContentStream: vi.fn()
      });
      
      vi.mocked(GoogleGenerativeAI).mockImplementation(() => ({
        getGenerativeModel: mockGetGenerativeModel,
        apiKey: 'mock-api-key',
        getGenerativeModelFromCachedContent: vi.fn()
      }));
      
      const geminiService = GeminiService.getInstance(API_KEY, MODEL_NAME);
      const result = await geminiService.sendMessage('Test prompt');
      
      expect(mockGenerateContent).toHaveBeenCalled();
      expect(result).toBe('Mock response text');
    });
    
    it('should return null if response has no text', async () => {
      // Setup mock implementation for this specific test
      const mockGenerateContent = vi.fn().mockResolvedValue({
        response: {
          text: () => null
        }
      });
      
      const mockGetGenerativeModel = vi.fn().mockReturnValue({
        generateContent: mockGenerateContent,
        generateContentStream: vi.fn()
      });
      
      vi.mocked(GoogleGenerativeAI).mockImplementation(() => ({
        getGenerativeModel: mockGetGenerativeModel,
        apiKey: 'mock-api-key',
        getGenerativeModelFromCachedContent: vi.fn()
      }));
      
      const geminiService = GeminiService.getInstance(API_KEY, MODEL_NAME);
      const result = await geminiService.sendMessage('Test prompt');
      
      expect(mockGenerateContent).toHaveBeenCalled();
      expect(result).toBeNull();
    });
    
    it('should throw an error if the API call fails', async () => {
      const errorMessage = 'API error';
      
      // Setup mock implementation for this specific test
      const mockGenerateContent = vi.fn().mockRejectedValue(new Error(errorMessage));
      
      const mockGetGenerativeModel = vi.fn().mockReturnValue({
        generateContent: mockGenerateContent,
        generateContentStream: vi.fn()
      });
      
      vi.mocked(GoogleGenerativeAI).mockImplementation(() => ({
        getGenerativeModel: mockGetGenerativeModel,
        apiKey: 'mock-api-key',
        getGenerativeModelFromCachedContent: vi.fn()
      }));
      
      const geminiService = GeminiService.getInstance(API_KEY, MODEL_NAME);
      
      await expect(geminiService.sendMessage('Test prompt')).rejects.toThrow(
        `Failed to send message to Gemini: ${errorMessage}`
      );
      expect(mockGenerateContent).toHaveBeenCalled();
    });
    
    it('should handle rate limiting errors', async () => {
      const errorMessage = '429 Too Many Requests';
      
      // Setup mock implementation for this specific test
      const mockGenerateContent = vi.fn().mockRejectedValue(new Error(errorMessage));
      
      const mockGetGenerativeModel = vi.fn().mockReturnValue({
        generateContent: mockGenerateContent,
        generateContentStream: vi.fn()
      });
      
      vi.mocked(GoogleGenerativeAI).mockImplementation(() => ({
        getGenerativeModel: mockGetGenerativeModel,
        apiKey: 'mock-api-key',
        getGenerativeModelFromCachedContent: vi.fn()
      }));
      
      const geminiService = GeminiService.getInstance(API_KEY, MODEL_NAME);
      
      await expect(geminiService.sendMessage('Test prompt')).rejects.toThrow(
        `Failed to send message to Gemini: ${errorMessage}`
      );
      expect(mockGenerateContent).toHaveBeenCalled();
    });
  });
  
  describe('streamMessage', () => {
    it('should stream a message and return the stream', async () => {
      // Create a mock async iterable
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { text: () => 'chunk1' };
        }
      };
      
      // Setup mock implementation for this specific test
      const mockGenerateContentStream = vi.fn().mockResolvedValue({
        stream: mockStream
      });
      
      const mockGetGenerativeModel = vi.fn().mockReturnValue({
        generateContent: vi.fn(),
        generateContentStream: mockGenerateContentStream
      });
      
      vi.mocked(GoogleGenerativeAI).mockImplementation(() => ({
        getGenerativeModel: mockGetGenerativeModel,
        apiKey: 'mock-api-key',
        getGenerativeModelFromCachedContent: vi.fn()
      }));
      
      const geminiService = GeminiService.getInstance(API_KEY, MODEL_NAME);
      const result = await geminiService.streamMessage('Test prompt');
      
      // Test that it's an async iterable
      expect(typeof result[Symbol.asyncIterator]).toBe('function');
      
      // We can't easily collect results from the stream in a test
      // But we can verify the structure
      expect(mockGenerateContentStream).toHaveBeenCalled();
    });
    
    it('should throw an error if the API call fails', async () => {
      const errorMessage = 'API error';
      
      // Setup mock implementation for this specific test
      const mockGenerateContentStream = vi.fn().mockRejectedValue(new Error(errorMessage));
      
      const mockGetGenerativeModel = vi.fn().mockReturnValue({
        generateContent: vi.fn(),
        generateContentStream: mockGenerateContentStream
      });
      
      vi.mocked(GoogleGenerativeAI).mockImplementation(() => ({
        getGenerativeModel: mockGetGenerativeModel,
        apiKey: 'mock-api-key',
        getGenerativeModelFromCachedContent: vi.fn()
      }));
      
      const geminiService = GeminiService.getInstance(API_KEY, MODEL_NAME);
      
      await expect(geminiService.streamMessage('Test prompt')).rejects.toThrow(
        `Failed to stream message from Gemini: ${errorMessage}`
      );
      expect(mockGenerateContentStream).toHaveBeenCalled();
    });
    
    it('should handle rate limiting errors', async () => {
      const errorMessage = '429 Too Many Requests';
      
      // Setup mock implementation for this specific test
      const mockGenerateContentStream = vi.fn().mockRejectedValue(new Error(errorMessage));
      
      const mockGetGenerativeModel = vi.fn().mockReturnValue({
        generateContent: vi.fn(),
        generateContentStream: mockGenerateContentStream
      });
      
      vi.mocked(GoogleGenerativeAI).mockImplementation(() => ({
        getGenerativeModel: mockGetGenerativeModel,
        apiKey: 'mock-api-key',
        getGenerativeModelFromCachedContent: vi.fn()
      }));
      
      const geminiService = GeminiService.getInstance(API_KEY, MODEL_NAME);
      
      await expect(geminiService.streamMessage('Test prompt')).rejects.toThrow(
        `Failed to stream message from Gemini: ${errorMessage}`
      );
      expect(mockGenerateContentStream).toHaveBeenCalled();
    });
  });
});