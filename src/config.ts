/**
 * Configuration file for TikTok crawler
 * Contains credentials and other settings
 */

import { Env } from "@lib/Env.js";

export const config = {
    // Login credentials
    credentials: {
        email: Env.TIKTOK_EMAIL,
        password: Env.TIKTOK_PASSWORD,
    },

    // Crawler settings
    crawler: {
        // Maximum wait time in milliseconds for debugging/inspection
        // maxWaitTime: Env.CRAWLER_MAX_WAIT_TIME,

        // Maximum time to wait for CAPTCHA resolution in milliseconds (5 minutes)
        // captchaTimeout: Env.CRAWLER_CAPTCHA_TIMEOUT,

        // Maximum number of CAPTCHA resolution attempts
        // maxCaptchaAttempts: Env.CRAWLER_MAX_CAPTCHA_ATTEMPTS,

        // Time to wait between actions to appear more human-like (ms)
        // humanDelayMin: Env.CRAWLER_HUMAN_DELAY_MIN,
        // humanDelayMax: Env.CRAWLER_HUMAN_DELAY_MAX,
    },

    // Paths for saving data and screenshots
    paths: {
        screenshots: Env.PATH_SCREENSHOTS,
        data: Env.PATH_DATA,
    },

    // Optional: Proxy settings
    proxy: {
        enabled: Env.PROXY_ENABLED,
        url: Env.PROXY_URL,
    },
    // FILTERS
    filters: {
        region: Env.FILTER_REGION,
        industry: Env.FILTER_INDUSTRY,
        objective: Env.FILTER_OBJECTIVE,
        period: Env.FILTER_PERIOD,
        adLanguage: Env.FILTER_AD_LANGUAGE,
        adFormat: Env.FILTER_AD_FORMAT,
        likes: Env.FILTER_LIKES,
    },

    // User agent settings
    userAgent: {
        // Set to true to use a custom user agent
        useCustom: Env.USER_AGENT_USE_CUSTOM,
        // Custom user agent string
        custom: Env.USER_AGENT_CUSTOM || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    },
};

export type Config = typeof config;
export type FilterConfig = Config['filters'];
export type CrawlerConfig = Config['crawler'];
export type PathsConfig = Config['paths'];
export type ProxyConfig = Config['proxy'];
export type UserAgentConfig = Config['userAgent'];
