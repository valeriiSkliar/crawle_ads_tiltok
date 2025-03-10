# TikTok Ads Crawler - OOP Refactoring Plan

## Phase 1: Class Hierarchy & Folder Structure

```
src/
├── core/
│   ├── TikTokCrawler.ts           # Main orchestrator class
│   ├── CrawlerConfig.ts           # Configuration management
│   └── types.ts                   # Shared type definitions
├── auth/
│   ├── AuthenticationService.ts   # Handles login process
│   ├── CaptchaHandler.ts          # CAPTCHA detection and handling
│   └── EmailVerificationHandler.ts # Email verification
├── navigation/
│   ├── Navigator.ts               # Base navigation class
│   └── FilterNavigator.ts         # Filter-specific navigation
├── filters/
│   ├── FilterBase.ts              # Abstract base filter class
│   ├── filters/                   # Implementations of specific filters
│   │   ├── SingleSelectFilter.ts
│   │   ├── MultiSelectFilter.ts
│   │   └── CascaderFilter.ts
│   └── FilterFactory.ts           # Creates appropriate filters
├── data/
│   ├── DataCollector.ts           # Base data collection class
│   ├── AdDataCollector.ts         # Ad-specific data collection
│   └── DataStorage.ts             # Saving collected data
├── services/
│   ├── ai/
│   │   ├── AIService.ts           # Base AI service interface
│   │   └── GeminiService.ts       # Gemini implementation
│   └── RequestInterceptor.ts      # API request interception
├── utils/
│   ├── Logger.ts                  # Enhanced logging
│   ├── Screenshotter.ts           # Screenshot management
│   └── HumanInteraction.ts        # Human-like behavior simulation
└── main.ts                        # Entry point
```

## Phase 2: Class Implementations

### Core Classes

#### `TikTokCrawler`
Main orchestrator of the crawling process.

```typescript
export class TikTokCrawler {
  private config: CrawlerConfig;
  private authService: AuthenticationService;
  private dataCollector: DataCollector;
  private filterNavigator: FilterNavigator;
  private requestInterceptor: RequestInterceptor;
  
  constructor(configPath?: string) {
    this.config = new CrawlerConfig(configPath);
    // Initialize other dependencies
  }
  
  public async initialize(): Promise<void> {
    // Set up crawler and dependencies
  }
  
  public async run(): Promise<void> {
    // Main execution flow
    await this.authService.login();
    await this.requestInterceptor.setupInterception();
    await this.filterNavigator.applyFilters(this.config.getFilters());
    await this.dataCollector.collect();
  }
  
  public async stop(): Promise<void> {
    // Cleanup resources
  }
}
```

#### `CrawlerConfig`
Handles configuration loading and validation.

```typescript
export class CrawlerConfig {
  private config: any;
  
  constructor(configPath?: string) {
    this.loadConfig(configPath);
  }
  
  private loadConfig(configPath?: string): void {
    // Load from file or environment variables
  }
  
  public validateConfig(): boolean {
    // Validate configuration values
    return true;
  }
  
  public getCredentials(): { email: string; password: string } {
    return this.config.credentials;
  }
  
  public getFilters(): FilterConfig {
    return this.config.filters;
  }
  
  // Other getters for specific config sections
}
```

### Authentication Classes

#### `AuthenticationService`
Handles the login process.

```typescript
export class AuthenticationService {
  private page: Page;
  private logger: Logger;
  private credentials: { email: string; password: string };
  private captchaHandler: CaptchaHandler;
  private emailVerificationHandler: EmailVerificationHandler;
  
  constructor(page: Page, logger: Logger, credentials: { email: string; password: string }) {
    this.page = page;
    this.logger = logger;
    this.credentials = credentials;
    this.captchaHandler = new CaptchaHandler(page, logger);
    this.emailVerificationHandler = new EmailVerificationHandler(page, logger);
  }
  
  public async login(): Promise<boolean> {
    if (await this.isLoggedIn()) {
      this.logger.info('Already logged in');
      return true;
    }
    
    await this.handleCookieConsent();
    await this.clickLoginButton();
    await this.selectPhoneEmailLogin();
    await this.fillLoginForm();
    const loginSuccess = await this.submitLoginForm();
    
    if (loginSuccess) {
      await this.captchaHandler.handleIfPresent();
      await this.emailVerificationHandler.handleIfPresent();
    }
    
    return await this.isLoggedIn();
  }
  
  public async isLoggedIn(): Promise<boolean> {
    // Implementation from existing isLoggedIn helper
  }
  
  private async handleCookieConsent(): Promise<void> {
    // Implementation from existing steps
  }
  
  // Other private methods for login process steps
}
```

#### `CaptchaHandler`
Specialized handler for CAPTCHA challenges.

```typescript
export class CaptchaHandler {
  private page: Page;
  private logger: Logger;
  
  constructor(page: Page, logger: Logger) {
    this.page = page;
    this.logger = logger;
  }
  
  public async handleIfPresent(): Promise<boolean> {
    if (await this.detectCaptcha()) {
      return await this.handleCaptcha();
    }
    return false;
  }
  
  private async detectCaptcha(): Promise<boolean> {
    // Detect if CAPTCHA is present
  }
  
  private async handleCaptcha(): Promise<boolean> {
    // Display message to user and wait for resolution
  }
}
```

### Filter Classes

#### `FilterBase` (Abstract)
Base class for all filter types.

```typescript
export abstract class FilterBase {
  protected page: Page;
  protected logger: Logger;
  protected selector: string;
  protected name: string;
  
  constructor(page: Page, logger: Logger, selector: string, name: string) {
    this.page = page;
    this.logger = logger;
    this.selector = selector;
    this.name = name;
  }
  
  public abstract async apply(value: string | string[]): Promise<boolean>;
  public abstract async clear(): Promise<void>;
  public abstract async getCurrentValue(): Promise<string | string[] | null>;
  
  protected async openFilter(): Promise<void> {
    await this.page.click(this.selector);
    await this.page.waitForTimeout(500);
  }
  
  protected async closeFilter(): Promise<void> {
    await this.page.click('body', { position: { x: 10, y: 10 } });
    await this.page.waitForTimeout(500);
  }
}
```

#### `MultiSelectFilter`
Implementation for multi-select filters.

```typescript
export class MultiSelectFilter extends FilterBase {
  public async apply(values: string[]): Promise<boolean> {
    this.logger.info(`Applying multi-select filter "${this.name}" with values:`, values);
    
    try {
      await this.openFilter();
      
      for (const value of values) {
        const optionSelector = `.byted-select-dropdown-option-content:has-text("${value}")`;
        await this.page.click(optionSelector).catch(async () => {
          this.logger.warning(`Option "${value}" not found for filter "${this.name}"`);
        });
        await this.page.waitForTimeout(300);
      }
      
      await this.closeFilter();
      return true;
    } catch (error) {
      this.logger.error(`Error applying filter "${this.name}":`, error);
      return false;
    }
  }
  
  public async clear(): Promise<void> {
    // Implementation based on existing clearFilterSelections
  }
  
  public async getCurrentValue(): Promise<string[]> {
    // Get current selected values
  }
}
```

#### `FilterFactory`
Creates appropriate filter instances based on type.

```typescript
export class FilterFactory {
  private page: Page;
  private logger: Logger;
  
  constructor(page: Page, logger: Logger) {
    this.page = page;
    this.logger = logger;
  }
  
  public async createFilter(element: FilterElement): Promise<FilterBase> {
    const { id, name, selector, type } = element;
    
    switch (type) {
      case FilterType.MULTI_SELECT:
        return new MultiSelectFilter(this.page, this.logger, selector, name);
      case FilterType.SINGLE_SELECT:
        return new SingleSelectFilter(this.page, this.logger, selector, name);
      case FilterType.CASCADER:
        return new CascaderFilter(this.page, this.logger, selector, name);
      default:
        throw new Error(`Unknown filter type: ${type}`);
    }
  }
  
  public async findAllFilters(): Promise<FilterBase[]> {
    // Find all filter elements and create appropriate filter objects
  }
}
```

### Data Collection Classes

#### `DataCollector`
Base class for data collection.

```typescript
export abstract class DataCollector {
  protected page: Page;
  protected logger: Logger;
  protected storage: DataStorage;
  
  constructor(page: Page, logger: Logger, storage: DataStorage) {
    this.page = page;
    this.logger = logger;
    this.storage = storage;
  }
  
  public abstract async collect(): Promise<void>;
  protected abstract async processData(rawData: any): Promise<any>;
}
```

#### `AdDataCollector`
Implementation for collecting ad data.

```typescript
export class AdDataCollector extends DataCollector {
  private scrollCount: number;
  private delayBetweenScrolls: number;
  
  constructor(
    page: Page, 
    logger: Logger, 
    storage: DataStorage,
    scrollCount: number = 20,
    delayBetweenScrolls: number = 10000
  ) {
    super(page, logger, storage);
    this.scrollCount = scrollCount;
    this.delayBetweenScrolls = delayBetweenScrolls;
  }
  
  public async collect(): Promise<void> {
    this.logger.info('Beginning data collection process');
    
    for (let i = 0; i < this.scrollCount; i++) {
      try {
        await this.scrollNaturally();
        await this.page.waitForTimeout(this.delayBetweenScrolls);
      } catch (error) {
        this.logger.error(`Error during scroll ${i + 1}:`, error);
      }
    }
    
    this.logger.info('Data collection complete');
  }
  
  protected async processData(rawData: any): Promise<any> {
    // Process raw data into structured format
  }
  
  private async scrollNaturally(): Promise<void> {
    // Implementation from existing scrollNaturally helper
  }
}
```

## Phase 3: Service Abstractions

### Human Interaction Service

```typescript
export class HumanInteractionService {
  private page: Page;
  
  constructor(page: Page) {
    this.page = page;
  }
  
  public async typeWithHumanDelay(element: any, text: string): Promise<void> {
    // Clear the field first
    await element.fill('');
    
    // Type each character with a random delay
    for (const char of text) {
      await element.press(char);
      await this.page.waitForTimeout(this.randomBetween(50, 250));
    }
  }
  
  public async scrollNaturally(
    maxScrolls: number = 10,
    minScrollPixels: number = 100,
    maxScrollPixels: number = 300,
    minDelay: number = 500,
    maxDelay: number = 1500,
    bottomMargin: number = 500
  ): Promise<number> {
    // Implementation from existing scrollNaturally helper
  }
  
  private randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
```

### Request Interception Service

```typescript
export class RequestInterceptor {
  private page: Page;
  private logger: Logger;
  private responsesDir: string;
  
  constructor(page: Page, logger: Logger, responsesDir: string) {
    this.page = page;
    this.logger = logger;
    this.responsesDir = responsesDir;
  }
  
  public async setupInterception(): Promise<void> {
    this.createResponseDir();
    
    await this.page.route('**/creative_radar_api/v1/top_ads/v2/list**', async (route) => {
      // Intercept and save API responses
      const response = await route.fetch();
      const responseBody = await response.json();
      
      const url = new URL(route.request().url());
      const params = Object.fromEntries(url.searchParams.entries());
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${this.responsesDir}/ads_response_${params.adLanguage || 'unknown'}_page${params.page || '0'}_${timestamp}.json`;
      
      await this.saveResponseToFile(fileName, responseBody);
      
      await route.continue();
    });
  }
  
  private createResponseDir(): void {
    // Create directory if it doesn't exist
  }
  
  private async saveResponseToFile(fileName: string, data: any): Promise<void> {
    // Save response data to file
  }
}
```

## Phase 4: Main Entry Point

```typescript
// main.ts
import { TikTokCrawler } from './core/TikTokCrawler';

async function main() {
  const crawler = new TikTokCrawler();
  await crawler.initialize();
  
  try {
    await crawler.run();
  } catch (error) {
    console.error('Crawler error:', error);
  } finally {
    await crawler.stop();
  }
}

main().catch(console.error);
```

## Implementation Strategy

1. **Incremental Changes**: Refactor one module at a time, starting with core classes
2. **Test As You Go**: Add unit tests for each refactored component
3. **Backward Compatibility**: Ensure the crawler still works during transition
4. **Documentation**: Add JSDoc comments to all classes and methods

## Benefits of OOP Refactoring

1. **Better Organization**: Clear separation of concerns
2. **Maintainability**: Easier to understand and modify
3. **Testability**: Classes can be tested in isolation
4. **Extensibility**: New features can be added by extending existing classes
5. **Reusability**: Components can be reused in other projects
