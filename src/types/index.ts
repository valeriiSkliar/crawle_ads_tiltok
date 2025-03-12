// Import types from global declarations
import '../global';

// Core database interfaces
export interface IDatabase {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query<T>(sql: string, params?: unknown[]): Promise<T>;
  checkDuplicate(key: string): Promise<boolean>;
}

// Captcha service types
export interface CaptchaDetectionResult {
  detected: boolean;
  type?: 'verify-container' | 'iframe' | 'image' | 'text';
  selector?: string;
  screenshot?: string;
}

export interface CaptchaSolvingResult {
  success: boolean;
  solution?: string;
  error?: string;
  attempts: number;
}

// Email verification types
export interface EmailVerificationResult {
  success: boolean;
  code?: string;
  error?: string;
  attempts: number;
  usedCode?: boolean;
}

// Session management types
export interface SessionState {
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
export type FilterType = 'multi-select' | 'single-select' | 'cascader';

export interface FilterElement {
  type: FilterType;
  selector: string;
  category: string;
  options?: string[];
}

export interface FilterConfig {
  region?: string[];
  industry?: string[];
  objective?: string[];
  period?: string;
  adLanguage?: string[];
  adFormat?: string[];
  likes?: number;
}

// Ad data types
export interface AdData {
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

export interface ApiResponse {
  success: boolean;
  data: AdData[];
  page?: number;
  totalPages?: number;
  error?: string;
}
