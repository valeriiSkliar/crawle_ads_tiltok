import type { Config, FilterConfig, CrawlerConfig as CrawlerConfigType } from "@/config.js";

// Default configuration to use when environment variables are not set
// const defaultConfig: Config = {
//     credentials: {
//         email: 'test@example.com',
//         password: 'password123',
//     },
//     crawler: {
//         maxWaitTime: 100000,
//         captchaTimeout: 300000,
//         maxCaptchaAttempts: 3,
//         humanDelayMin: 500,
//         humanDelayMax: 2000,
//     },
//     paths: {
//         screenshots: 'storage/screenshots/',
//         data: 'storage/data/',
//     },
//     proxy: {
//         enabled: false,
//         url: '',
//     },
//     filters: {
//         region: ['Algeria', 'United States'],
//         industry: ['E-commerce'],
//         objective: [],
//         period: 'Last 7 days',
//         adLanguage: ['English'],
//         adFormat: '',
//         likes: [],
//     },
//     userAgent: {
//         useCustom: false,
//         custom: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
//     },
// };

export class CrawlerConfig {
    private config: Config | null = null;
    
    constructor() {
        // Constructors can't be async, so we don't load config here
        // The caller should call loadConfig before using any config methods
    }
    
    public async loadConfig(): Promise<void> {
        try {
            // Try to import the config, but fall back to default config if there's an error
            try {
                const configModule = await import('@/config.js');
                // console.log(configModule.config);
                this.config = configModule.config;
            } catch (importError) {
                console.warn('Failed to import configuration, using default config:', importError);
                throw new Error('Failed to import configuration');
            }
            
            if (!this.config) {
                console.warn('Configuration is null, using default config');
                throw new Error('Configuration is null');
            }
            
            console.log('Configuration loaded successfully');
        } catch (error) {
            console.error('Error loading configuration:', error);
            throw new Error('Failed to load configuration');
        }
    }
    
    public validateConfig(): boolean {
        // Validate configuration values
        return true;
    }
    
    public getCredentials(): { email: string; password: string } {
        if (!this.config) {
            throw new Error('Configuration not loaded');
        }
        return this.config.credentials;
    }
    
    public getFilters(): FilterConfig {
        if (!this.config) {
            throw new Error('Configuration not loaded');
        }
        return this.config.filters;
    }
    
    public getCrawlerConfig(): CrawlerConfigType {
        if (!this.config) {
            throw new Error('Configuration not loaded');
        }
        return this.config.crawler;
    }
    
    // Other getters for specific config sections
}