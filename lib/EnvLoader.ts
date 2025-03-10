import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file in the project root
const result = dotenv.config({ path: path.resolve(__dirname, '../.env') });

if (result.error) {
  console.error('Error loading .env file:', result.error);
  process.exit(1);
}

// Export environment variables for use in the application
export const ENV = {
  // TikTok Credentials
  TIKTOK_EMAIL: process.env.TIKTOK_EMAIL || '',
  TIKTOK_PASSWORD: process.env.TIKTOK_PASSWORD || '',
  
  // Crawler Settings
  CRAWLER_MAX_WAIT_TIME: parseInt(process.env.CRAWLER_MAX_WAIT_TIME || '100000', 10),
  CRAWLER_CAPTCHA_TIMEOUT: parseInt(process.env.CRAWLER_CAPTCHA_TIMEOUT || '300000', 10),
  CRAWLER_MAX_CAPTCHA_ATTEMPTS: parseInt(process.env.CRAWLER_MAX_CAPTCHA_ATTEMPTS || '3', 10),
  CRAWLER_HUMAN_DELAY_MIN: parseInt(process.env.CRAWLER_HUMAN_DELAY_MIN || '500', 10),
  CRAWLER_HUMAN_DELAY_MAX: parseInt(process.env.CRAWLER_HUMAN_DELAY_MAX || '1000', 10),
  
  // Storage Paths
  PATH_SCREENSHOTS: process.env.PATH_SCREENSHOTS || 'storage/screenshots/',
  PATH_DATA: process.env.PATH_DATA || 'storage/api-responses/',
  
  // Proxy Settings
  PROXY_ENABLED: process.env.PROXY_ENABLED === 'true',
  PROXY_URL: process.env.PROXY_URL || '',
  
  // Filter Settings
  FILTER_REGION: (process.env.FILTER_REGION || '').split(',').map(item => item.trim()).filter(Boolean),
  FILTER_INDUSTRY: (process.env.FILTER_INDUSTRY || '').split(',').map(item => item.trim()).filter(Boolean),
  FILTER_OBJECTIVE: (process.env.FILTER_OBJECTIVE || '').split(',').map(item => item.trim()).filter(Boolean),
  FILTER_PERIOD: process.env.FILTER_PERIOD || '',
  FILTER_AD_LANGUAGE: (process.env.FILTER_AD_LANGUAGE || '').split(',').map(item => item.trim()).filter(Boolean),
  FILTER_AD_FORMAT: process.env.FILTER_AD_FORMAT || '',
  FILTER_LIKES: (process.env.FILTER_LIKES || '').split(',').map(item => item.trim()).filter(Boolean),
  
  // User Agent Settings
  USER_AGENT_USE_CUSTOM: process.env.USER_AGENT_USE_CUSTOM === 'true',
  USER_AGENT_CUSTOM: process.env.USER_AGENT_CUSTOM || '',
};