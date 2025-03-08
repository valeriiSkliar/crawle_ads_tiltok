// For more information, see https://crawlee.dev/
import { PlaywrightCrawler, ProxyConfiguration } from 'crawlee';
import dotenv from 'dotenv';
import { router } from './routes.js';
import GeminiService from './ai_service/gemini-api.js';

dotenv.config();

const startUrls = ['https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en'];

const apiKey = process.env.GEMINI_API_KEY ?? '';  // Store your API key securely!
const modelName = "gemini-2.0-flash-lite-001"; // Updated to the correct model name

// if (!apiKey) {
//   console.error("GEMINI_API_KEY environment variable not set.");
//   return;
// }

const gemini = GeminiService.getInstance(apiKey, modelName);

const crawler = new PlaywrightCrawler({
    headless: false,
    // proxyConfiguration: new ProxyConfiguration({ proxyUrls: ['...'] }),
    requestHandler: router,
    // Increase the timeout to prevent restarting during long operations
    navigationTimeoutSecs: 300, // 5 minutes
    // maxRequestsPerCrawl: 20,
    requestHandlerTimeoutSecs: 600, // 10 minutes
    // Remove the maxRequestsPerCrawl limit to allow the crawler to run continuously
    // maxRequestsPerCrawl: 20,
    maxRequestRetries: 1, // Reduce retries to prevent excessive restarts
});

await crawler.run(startUrls);
