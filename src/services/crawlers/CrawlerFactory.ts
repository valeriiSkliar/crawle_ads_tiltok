import { 
  PlaywrightCrawler, 
  CheerioCrawler, 
  PuppeteerCrawler, 
  JSDOMCrawler,
  Router,
  PlaywrightCrawlingContext,
  CheerioCrawlingContext,
  PuppeteerCrawlingContext,
  JSDOMCrawlingContext,
  createPlaywrightRouter,
  createCheerioRouter,
  createPuppeteerRouter,
  createJSDOMRouter,
  RouterHandler
} from 'crawlee';

// Define a type for the different crawler types
export type CrawlerType = 'playwright' | 'cheerio' | 'puppeteer' | 'jsdom';
export type MainContext = PlaywrightCrawlingContext | CheerioCrawlingContext | PuppeteerCrawlingContext | JSDOMCrawlingContext;
// Define interfaces for crawler options
export interface BaseCrawlerOptions {
  maxRequestRetries?: number;
  requestHandlerTimeoutSecs?: number;
  sessionPoolOptions?: {
    persistStateKeyValueStoreId?: string;
    maxPoolSize?: number;
  };
}

export interface BrowserCrawlerOptions extends BaseCrawlerOptions {
  headless?: boolean;
  navigationTimeoutSecs?: number;
}

export interface PlaywrightCrawlerOptions extends BrowserCrawlerOptions {
  // Playwright-specific options
  extraOptions?: Record<string, unknown>;
}

export interface CheerioCrawlerOptions extends BaseCrawlerOptions {
  // Cheerio-specific options
  maxConcurrency?: number;
}

export interface PuppeteerCrawlerOptions extends BrowserCrawlerOptions {
  // Puppeteer-specific options
  extraOptions?: Record<string, unknown>;
}

export interface JSDOMCrawlerOptions extends BaseCrawlerOptions {
  // JSDOM-specific options
  maxConcurrency?: number;
}

/**
 * Factory class for creating different types of crawlers
 */
export class CrawlerFactory {
  /**
   * Creates a Playwright crawler
   */
  public static createPlaywrightCrawler(
    router: Router<PlaywrightCrawlingContext>,
    options: PlaywrightCrawlerOptions = {}
  ): PlaywrightCrawler {
    return new PlaywrightCrawler({
      // Configure headless mode
      launchContext: {
        launchOptions: {
          headless: options.headless ?? true,
        },
      },
      
      // Use a function that delegates to the router
      requestHandler: router.getHandler(),
      
      // Set timeouts
      navigationTimeoutSecs: options.navigationTimeoutSecs ?? 300, // 5 minutes
      requestHandlerTimeoutSecs: options.requestHandlerTimeoutSecs ?? 600, // 10 minutes
      
      // Configure retry behavior
      maxRequestRetries: options.maxRequestRetries ?? 2,
      
      // Configure session management
      sessionPoolOptions: {
        persistStateKeyValueStoreId: options.sessionPoolOptions?.persistStateKeyValueStoreId ?? 'crawler-session-store',
        maxPoolSize: options.sessionPoolOptions?.maxPoolSize ?? 1,
      },
      
      // Define failed request handler
      failedRequestHandler: ({ request, log, error }) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log.error(`Request ${request.url} failed: ${errorMessage}`);
      },
    });
  }

  /**
   * Creates a Cheerio crawler
   */
  public static createCheerioCrawler(
    router: Router<CheerioCrawlingContext>,
    options: CheerioCrawlerOptions = {}
  ): CheerioCrawler {
    return new CheerioCrawler({
      // Use a function that delegates to the router
      requestHandler: router.getHandler(),
      
      // Set timeouts
      requestHandlerTimeoutSecs: options.requestHandlerTimeoutSecs ?? 60,
      
      // Configure retry behavior
      maxRequestRetries: options.maxRequestRetries ?? 2,
      
      // Configure session management
      sessionPoolOptions: {
        persistStateKeyValueStoreId: options.sessionPoolOptions?.persistStateKeyValueStoreId ?? 'cheerio-session-store',
        maxPoolSize: options.sessionPoolOptions?.maxPoolSize ?? 1,
      },
      
      // Define failed request handler
      failedRequestHandler: ({ request, log, error }) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log.error(`Request ${request.url} failed: ${errorMessage}`);
      },
    });
  }

  /**
   * Creates a Puppeteer crawler
   */
  public static createPuppeteerCrawler(
    router: Router<PuppeteerCrawlingContext>,
    options: PuppeteerCrawlerOptions = {}
  ): PuppeteerCrawler {
    if (!router) {
      throw new Error('Router is required for PuppeteerCrawler');
    }
    return new PuppeteerCrawler({
      // Configure headless mode
      launchContext: {
        launchOptions: {
          headless: options.headless ?? false,
        },
      },
      
      // Use a function that delegates to the router
      requestHandler: router.getHandler(),
      
      // Set timeouts
      navigationTimeoutSecs: options.navigationTimeoutSecs ?? 300,
      requestHandlerTimeoutSecs: options.requestHandlerTimeoutSecs ?? 600,
      
      // Configure retry behavior
      maxRequestRetries: options.maxRequestRetries ?? 2,
      
      // Configure session management
      sessionPoolOptions: {
        persistStateKeyValueStoreId: options.sessionPoolOptions?.persistStateKeyValueStoreId ?? 'puppeteer-session-store',
        maxPoolSize: options.sessionPoolOptions?.maxPoolSize ?? 1,
      },
      
      // Define failed request handler
      failedRequestHandler: ({ request, log, error }) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log.error(`Request ${request.url} failed: ${errorMessage}`);
      },
    });
  }

  /**
   * Creates a JSDOM crawler
   */
  public static createJSDOMCrawler(
    router: Router<JSDOMCrawlingContext>,
    options: JSDOMCrawlerOptions = {}
  ): JSDOMCrawler {
    return new JSDOMCrawler({
      // Use a function that delegates to the router
      requestHandler: router.getHandler(),
      
      // Set timeouts
      requestHandlerTimeoutSecs: options.requestHandlerTimeoutSecs ?? 60,
      
      // Configure retry behavior
      maxRequestRetries: options.maxRequestRetries ?? 2,
      
      // Configure session management
      sessionPoolOptions: {
        persistStateKeyValueStoreId: options.sessionPoolOptions?.persistStateKeyValueStoreId ?? 'jsdom-session-store',
        maxPoolSize: options.sessionPoolOptions?.maxPoolSize ?? 1,
      },
      
      // Define failed request handler
      failedRequestHandler: ({ request, log, error }) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        log.error(`Request ${request.url} failed: ${errorMessage}`);
      },
    });
  }

  /**
   * Creates the appropriate router for the given crawler type
   */
  public static createRouter(type: CrawlerType): RouterHandler<PlaywrightCrawlingContext> | RouterHandler<CheerioCrawlingContext> | RouterHandler<PuppeteerCrawlingContext> | RouterHandler<JSDOMCrawlingContext> {
    switch (type) {
      case 'playwright':
        return this.createPlaywrightRouter();
      case 'cheerio':
        return this.createCheerioRouter();
      case 'puppeteer':
        return this.createPuppeteerRouter();
      case 'jsdom':
        return this.createJSDOMRouter();
      default:
        throw new Error(`Unsupported crawler type: ${type}`);
    }
  }

  /**
   * Creates a Playwright router
   */
  public static createPlaywrightRouter(): RouterHandler<PlaywrightCrawlingContext> {
    return createPlaywrightRouter();
  }

  /**
   * Creates a Cheerio router
   */
  public static createCheerioRouter(): RouterHandler<CheerioCrawlingContext> {
    return createCheerioRouter();
  }

  /**
   * Creates a Puppeteer router
   */
  public static createPuppeteerRouter(): RouterHandler<PuppeteerCrawlingContext> {
    return createPuppeteerRouter();
  }

  /**
   * Creates a JSDOM router
   */
  public static createJSDOMRouter(): RouterHandler<JSDOMCrawlingContext> {
    return createJSDOMRouter();
  }

  /**
   * Creates a crawler of the specified type
   */
  public static createCrawler(
    type: CrawlerType, 
    router: Router<PlaywrightCrawlingContext> | Router<CheerioCrawlingContext> | Router<PuppeteerCrawlingContext> | Router<JSDOMCrawlingContext>, 
    options: BaseCrawlerOptions = {}
  ): PlaywrightCrawler | CheerioCrawler | PuppeteerCrawler | JSDOMCrawler {
    switch (type) {
      case 'playwright':
        return this.createPlaywrightCrawler(router as Router<PlaywrightCrawlingContext>, options as PlaywrightCrawlerOptions);
      case 'cheerio':
        return this.createCheerioCrawler(router as Router<CheerioCrawlingContext>, options as CheerioCrawlerOptions);
      case 'puppeteer':
        return this.createPuppeteerCrawler(router as Router<PuppeteerCrawlingContext>, options as PuppeteerCrawlerOptions);
      case 'jsdom':
        return this.createJSDOMCrawler(router as Router<JSDOMCrawlingContext>, options as JSDOMCrawlerOptions);
      default:
        throw new Error(`Unsupported crawler type: ${type}`);
    }
  }
}
