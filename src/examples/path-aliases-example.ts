/**
 * Example file demonstrating how to use path aliases in the TikTok Crawler project
 */

// Using path aliases instead of relative imports
import { config } from '@/config.js';
import { Env } from '@lib/Env.js';

// Core imports
// import { TikTokCrawler } from '@core/TikTokCrawler.js';
// import { CrawlerConfig } from '@core/CrawlerConfig.js';
// Remove or comment out the types import since it might not exist yet
// import * as Types from '@core/types.js';

// Auth imports
// import { AuthenticationService } from '@auth/AuthenticationService.js';
// import { CaptchaHandler } from '@auth/CaptchaHandler.js';

// Navigation imports
// import { Navigator } from '@navigation/Navigator.js';
// import { FilterNavigator } from '@navigation/FilterNavigator.js';

// Filters imports
// import { FilterBase } from '@filters/FilterBase.js';
// import { FilterFactory } from '@filters/FilterFactory.js';

// Data imports
// import { DataCollector } from '@data/DataCollector.js';
// import { DataStorage } from '@data/DataStorage.js';

// Services imports
// import { AIService } from '@services/ai/AIService.js';
// import { RequestInterceptor } from '@services/RequestInterceptor.js';

// Utils imports
// import { Logger } from '@utils/Logger.js';
// import { Screenshotter } from '@utils/Screenshotter.js';

/**
 * Example function showing how to use imports with path aliases
 */
async function exampleFunction() {
  console.log('Using path aliases for cleaner imports');
  
  // Using config with environment variables
  console.log(`TikTok Email: ${config.credentials.email}`);
  console.log(`Filter Regions: ${config.filters.region.join(', ')}`);
  
  // Using environment variables directly
  console.log(`API Key: ${Env.GEMINI_API_KEY ? 'Configured' : 'Not configured'}`);
}

export { exampleFunction };
