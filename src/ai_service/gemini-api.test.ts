import { jest } from '@jest/globals';
import GeminiService from './gemini-api';
import { GoogleGenerativeAI, GenerateContentResponse } from '@google/generative-ai';

// Mock the GoogleGenerativeAI module
jest.mock('@google/generative-ai', () => {
  const mockGenerateContent = jest.fn();
  const mockGenerateContentStream = jest.fn();
  
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: mockGenerateContent,
        generateContentStream: mockGenerateContentStream,
      }),
    })),
    mockGenerateContent,
    mockGenerateContentStream,
  };
});

describe('GeminiService', () => {
  const API_KEY = 'test-api-key';
  const MODEL_NAME = 'gemini-2.0-flash-lite-001';
  let geminiService: GeminiService;
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Get a fresh instance of GeminiService
    geminiService = GeminiService.getInstance(API_KEY, MODEL_NAME);
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
      expect(() => GeminiService.getInstance('', MODEL_NAME)).toThrow('Gemini API Key is required.');
    });
  });
  
  describe('sendMessage', () => {
    it('should send a message and return the response text', async () => {
      const mockResponse = {
        response: {
          text: jest.fn().mockReturnValue('Mock response text'),
        },
      };
      
      (GoogleGenerativeAI as unknown as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockResolvedValue(mockResponse),
        }),
      }));
      
      const geminiService = GeminiService.getInstance(API_KEY, MODEL_NAME);
      const result = await geminiService.sendMessage('Test prompt');
      
      expect(result).toBe('Mock response text');
    });
    
    it('should return null if response has no text', async () => {
      const mockResponse = {
        response: {
          text: jest.fn().mockReturnValue(null),
        },
      };
      
      (GoogleGenerativeAI as unknown as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockResolvedValue(mockResponse),
        }),
      }));
      
      const geminiService = GeminiService.getInstance(API_KEY, MODEL_NAME);
      const result = await geminiService.sendMessage('Test prompt');
      
      expect(result).toBeNull();
    });
    
    it('should throw an error if the API call fails', async () => {
      const errorMessage = 'API error';
      
      (GoogleGenerativeAI as unknown as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockRejectedValue(new Error(errorMessage)),
        }),
      }));
      
      const geminiService = GeminiService.getInstance(API_KEY, MODEL_NAME);
      
      await expect(geminiService.sendMessage('Test prompt')).rejects.toThrow(
        `Failed to send message to Gemini: ${errorMessage}`
      );
    });
    
    it('should handle rate limiting errors', async () => {
      const errorMessage = '429 Too Many Requests';
      
      (GoogleGenerativeAI as unknown as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContent: jest.fn().mockRejectedValue(new Error(errorMessage)),
        }),
      }));
      
      const geminiService = GeminiService.getInstance(API_KEY, MODEL_NAME);
      
      await expect(geminiService.sendMessage('Test prompt')).rejects.toThrow(
        `Failed to send message to Gemini: ${errorMessage}`
      );
    });
  });
  
  describe('streamMessage', () => {
    it('should stream a message and return the stream', async () => {
      const mockStream = Symbol('mock stream');
      const mockResponse = {
        stream: mockStream,
      };
      
      (GoogleGenerativeAI as unknown as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContentStream: jest.fn().mockResolvedValue(mockResponse),
        }),
      }));
      
      const geminiService = GeminiService.getInstance(API_KEY, MODEL_NAME);
      const result = await geminiService.streamMessage('Test prompt');
      
      expect(result).toBe(mockStream);
    });
    
    it('should throw an error if the API call fails', async () => {
      const errorMessage = 'API error';
      
      (GoogleGenerativeAI as unknown as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContentStream: jest.fn().mockRejectedValue(new Error(errorMessage)),
        }),
      }));
      
      const geminiService = GeminiService.getInstance(API_KEY, MODEL_NAME);
      
      await expect(geminiService.streamMessage('Test prompt')).rejects.toThrow(
        `Failed to stream message from Gemini: ${errorMessage}`
      );
    });
    
    it('should handle rate limiting errors', async () => {
      const errorMessage = '429 Too Many Requests';
      
      (GoogleGenerativeAI as unknown as jest.Mock).mockImplementation(() => ({
        getGenerativeModel: jest.fn().mockReturnValue({
          generateContentStream: jest.fn().mockRejectedValue(new Error(errorMessage)),
        }),
      }));
      
      const geminiService = GeminiService.getInstance(API_KEY, MODEL_NAME);
      
      await expect(geminiService.streamMessage('Test prompt')).rejects.toThrow(
        `Failed to stream message from Gemini: ${errorMessage}`
      );
    });
  });
});
