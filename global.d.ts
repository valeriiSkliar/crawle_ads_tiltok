export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_TYPE: 'sqlite' | 'postgres';
      DATABASE_URL: string;
      GEMINI_API_KEY: string;
    }
  }

  namespace TikTokAds {
    // Database interfaces
    interface IDatabase {
      connect(): Promise<void>;
      disconnect(): Promise<void>;
      query<T>(sql: string, params?: unknown[]): Promise<T>;
      checkDuplicate(key: string): Promise<boolean>;
    }

    // Captcha handling interfaces
    interface CaptchaDetectionResult {
      detected: boolean;
      type?: 'verify-container' | 'iframe' | 'image' | 'text';
      selector?: string;
      screenshot?: string;
    }

    interface CaptchaSolvingResult {
      success: boolean;
      solution?: string;
      error?: string;
      attempts: number;
    }

    // Email verification interfaces
    interface EmailVerificationResult {
      success: boolean;
      code?: string;
      error?: string;
      attempts: number;
      usedCode?: boolean;
    }

    // Session management interfaces
    interface SessionState {
      cookies: Array<{
        name: string;
        value: string;
        domain: string;
        path: string;
        expires?: number;
        httpOnly?: boolean;
        secure?: boolean;
        sameSite?: 'Strict' | 'Lax' | 'None';
      }>;
      localStorage: Record<string, string>;
    }

    // Filter system types
    type FilterType = 'multi-select' | 'single-select' | 'cascader';
    
    interface FilterElement {
      type: FilterType;
      selector: string;
      category: string;
      options?: string[];
    }

    interface FilterConfig {
      region?: string[];
      industry?: string[];
      objective?: string[];
      period?: string;
      adLanguage?: string[];
      adFormat?: string[];
      likes?: number;
    }

    // Ad data interfaces
    interface AdData {
      id: string;
      title: string;
      description?: string;
      advertiser?: string;
      metrics?: {
        likes?: number;
        comments?: number;
        shares?: number;
      };
      createdAt?: string;
      region?: string;
      industry?: string;
      format?: string;
    }

    interface ApiResponse {
      success: boolean;
      data: AdData[];
      page?: number;
      totalPages?: number;
      error?: string;
    }
  }
}
