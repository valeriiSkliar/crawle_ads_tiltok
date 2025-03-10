// For more information, see https://crawlee.dev/
// import { PlaywrightCrawler } from 'crawlee';
// import dotenv from 'dotenv';
// import { router } from './routes.js';

// dotenv.config();

// const startUrls = ['https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en'];


// // if (!apiKey) {
// //   console.error("GEMINI_API_KEY environment variable not set.");
// //   return;
// // }


// const crawler = new PlaywrightCrawler({
//     headless: false,
//     // proxyConfiguration: new ProxyConfiguration({ proxyUrls: ['...'] }),
//     requestHandler: router,
//     // Increase the timeout to prevent restarting during long operations
//     navigationTimeoutSecs: 300, // 5 minutes
//     // maxRequestsPerCrawl: 20,
//     requestHandlerTimeoutSecs: 600, // 10 minutes
//     // Remove the maxRequestsPerCrawl limit to allow the crawler to run continuously
//     // maxRequestsPerCrawl: 20,
//     maxRequestRetries: 1, // Reduce retries to prevent excessive restarts
// });

// await crawler.run(startUrls);

// main.ts
import { TikTokCrawler } from '@core/TikTokCrawler.js';
import dotenv from 'dotenv';

// Load environment variables from .env file
// This must be done before any imports that use environment variables
dotenv.config({ debug: process.env.NODE_ENV === 'development' });

// Log the environment mode
console.log(`Running in ${process.env.NODE_ENV || 'development'} mode`);

async function main() {
  console.log('Starting TikTok Ads Crawler...');
  
  const crawler = new TikTokCrawler();
  
  try {
    // Initialize the crawler (this will load the configuration)
    console.log('Initializing crawler...');
    await crawler.initialize();
    
    // Run the crawler
    console.log('Running crawler...');
    await crawler.run();
    
    console.log('Crawler completed successfully');
  } catch (error) {
    console.error('Crawler error:', error);
  } finally {
    console.log('Stopping crawler...');
    await crawler.stop();
    console.log('Crawler stopped');
  }
}

// Start the crawler
main().catch(error => {
  console.error('Fatal error in main process:', error);
  process.exit(1);
});