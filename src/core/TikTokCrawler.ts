import { CrawlerConfig as CrawlerConfigClass } from "./CrawlerConfig.js";
import { Router, PlaywrightCrawlingContext, CheerioCrawlingContext, PuppeteerCrawlingContext, JSDOMCrawlingContext, PlaywrightCrawler, CheerioCrawler, PuppeteerCrawler, JSDOMCrawler } from 'crawlee';
import { StorageDirectories } from '@/services/configAndCheck/StorageDirectories.js';
import { CrawlerFactory, CrawlerType, BaseCrawlerOptions } from '@/services/crawlers/CrawlerFactory.js';


export class TikTokCrawler {
  private crawler: PlaywrightCrawler | CheerioCrawler | PuppeteerCrawler | JSDOMCrawler | null = null;
  private router: Router<PlaywrightCrawlingContext> | Router<CheerioCrawlingContext> | Router<PuppeteerCrawlingContext> | Router<JSDOMCrawlingContext> | null = null;
  private configManager: CrawlerConfigClass;
  private storageDirectories: StorageDirectories;
  private crawlerType: CrawlerType = 'playwright'; // Default crawler type
  
  constructor() {
    this.configManager = new CrawlerConfigClass();
    this.storageDirectories = new StorageDirectories();
    this.router = CrawlerFactory.createRouter(this.crawlerType);
  }
  
  public async initialize(): Promise<void> {
    try {
      // Ensure storage directories exist
      this.storageDirectories.ensureDirectories();
      
      // Set up crawler and dependencies
      await this.setupCrawler();
      
      console.log('Playwright crawler initialized successfully');
    } catch (error) {
      console.error('Failed to initialize TikTok Crawler:', error);
      throw error;
    }
  }

  /**
   * Set the crawler type to use
   * @param type The type of crawler to use
   */
  public setCrawlerType(type: CrawlerType): void {
    this.crawlerType = type;
    console.log(`Crawler type set to: ${type}`);
  }

  /**
   * Get the current crawler type
   */
  public getCrawlerType(): CrawlerType {
    return this.crawlerType;
  }

  /**
   * Set up the crawler with the specified options
   */
  private async setupCrawler(options: BaseCrawlerOptions = {}): Promise<void> {
    // Initialize the router if not already done
    if (!this.router) {
      this.router = CrawlerFactory.createRouter(this.crawlerType);
      this.setupRoutes();
    }
    
    // Set up default options
    const crawlerOptions: BaseCrawlerOptions = {
      // navigationTimeoutSecs: 300, // 5 minutes
      requestHandlerTimeoutSecs: 600, // 10 minutes
      maxRequestRetries: 2,
      sessionPoolOptions: {
        persistStateKeyValueStoreId: 'tiktok-session-store',
        maxPoolSize: 1, // Single session for this crawler
      },
      ...options,
      // Add headless option for browser-based crawlers
      ...(this.crawlerType === 'playwright' || this.crawlerType === 'puppeteer' ? { headless: false } : {})
    };
    
    // Create the crawler using the factory
    this.crawler = CrawlerFactory.createCrawler(this.crawlerType, this.router, crawlerOptions);
    
    console.log(`${this.crawlerType.charAt(0).toUpperCase() + this.crawlerType.slice(1)} crawler setup completed`);
  }
  
  private setupRoutes(): void {
    if (!this.router) return;
    
    // Add default route handler
    this.router.addDefaultHandler(async ({ log, page, request }) => {
      log.info(`Processing ${request.url}...`);
      
      try {
        // Implement login, navigation, and data collection logic here
        // This is where you would call your authentication, filtering, and data collection services
        
        // Example: Take a screenshot for debugging
        await page.screenshot({ 
          path: `${this.storageDirectories.getScreenshotsDir()}/page-${Date.now()}.png`,
          fullPage: true 
        });
        
        log.info('Page processing completed');
      } catch (error) {
        log.error(`Error processing page: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }
  
  public async run(): Promise<void> {
    if (!this.crawler) {
      throw new Error('Crawler not initialized. Call initialize() first.');
    }
    
    try {
      // Define the starting URL for TikTok Ads Creative Center
      const startUrls = ['https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en'];
      
      // Add the starting URLs to the crawler's request queue with a label
      await this.crawler.addRequests(startUrls.map(url => ({
        url,
        userData: {
          label: 'START', // Adding a label for the router
        },
      })));
      
      // Run the crawler and wait for it to finish
      console.log('Starting crawler run...');
      await this.crawler.run();
      console.log('Crawler run completed');
    } catch (error) {
      console.error('Error during crawler run:', error);
      throw error;
    }
  }
  
  public async stop(): Promise<void> {
    try {
      // Stop the crawler if it's running
      if (this.crawler) {
        console.log('Stopping crawler...');
        await this.crawler.teardown();
        console.log('Crawler stopped successfully');
      }
      
      // Clean up any other resources
      this.crawler = null;
    } catch (error) {
      console.error('Error stopping crawler:', error);
      throw error;
    }
  }
}