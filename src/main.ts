// Load environment variables first
import dotenv from 'dotenv';
dotenv.config();

// Set DATABASE_URL for Prisma if not set
// This must happen before importing any modules that use Prisma
// import { Env } from '@lib/Env.js';
// if (!process.env.DATABASE_URL && Env.DATABASE_SQLITE_URL) {
//     process.env.DATABASE_URL = Env.DATABASE_SQLITE_URL;
//     console.log('Set DATABASE_URL to:', Env.DATABASE_SQLITE_URL);
// }

// For more information, see https://crawlee.dev/
import { PlaywrightCrawler } from 'crawlee';
import { router } from './routes.js';

const startUrls = ['https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en'];


// if (!apiKey) {
//   console.error("GEMINI_API_KEY environment variable not set.");
//   return;
// }

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
    launchContext: {
        launchOptions: {
            args: ['--window-size=1920,1080'],
            viewport: { width: 1920, height: 1080 }
        }
    }
});


// log.info('Starting crawler run...');
// log.info('env', Env);

await crawler.run(startUrls);
