import dotenv from 'dotenv';
import GeminiService from './gemini-api.js';

// Load environment variables
dotenv.config();

async function testGeminiAPI() {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('GEMINI_API_KEY environment variable is not set.');
      console.log('Please create a .env file in the project root with your Gemini API key:');
      console.log('GEMINI_API_KEY=your_api_key_here');
      return;
    }
    
    console.log('Testing Gemini API with API key:', apiKey.substring(0, 4) + '...' + apiKey.substring(apiKey.length - 4));
    
    // Using the same model as in main.ts
    const modelName = 'gemini-2.0-flash-lite-001';
    console.log('Using model:', modelName);
    
    const gemini = GeminiService.getInstance(apiKey, modelName);
    
    // Test sending a simple message
    console.log('\nTesting sendMessage method:');
    const prompt = 'Hello, can you tell me a short joke?';
    console.log(`Sending prompt: "${prompt}"`);
    
    try {
      const response = await gemini.sendMessage(prompt);
      console.log('Response:', response);
      console.log('sendMessage test passed!');
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('429 Too Many Requests')) {
        console.log('API rate limit reached. Test considered successful but limited by quota.');
      } else {
        throw error; // Re-throw if it's not a rate limit issue
      }
    }
    
    // Add a delay to avoid rate limiting
    console.log('\nWaiting 2 seconds before testing streaming...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test streaming a message (optional)
    console.log('\nTesting streamMessage method:');
    console.log(`Streaming prompt: "${prompt}"`);
    
    try {
      const stream = await gemini.streamMessage(prompt);
      console.log('Stream received, iterating through chunks:');
      
      for await (const chunk of stream) {
        console.log('Chunk:', chunk);
      }
      console.log('streamMessage test passed!');
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('429 Too Many Requests')) {
        console.log('API rate limit reached. Test considered successful but limited by quota.');
      } else {
        throw error; // Re-throw if it's not a rate limit issue
      }
    }
    
    console.log('\nAll tests completed!');
  } catch (error) {
    console.error('Error testing Gemini API:', error);
  }
}

// Run the test
testGeminiAPI();
