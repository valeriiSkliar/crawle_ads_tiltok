/**
 * Configuration file for TikTok crawler
 * Contains credentials and other settings
 */

import { ENV } from "../lib/EnvLoader.js";

export const config = {
    // Login credentials
    credentials: {
        email: ENV.TIKTOK_EMAIL,
        password: ENV.TIKTOK_PASSWORD,
    },

    // Crawler settings
    crawler: {
        // Maximum wait time in milliseconds for debugging/inspection
        maxWaitTime: ENV.CRAWLER_MAX_WAIT_TIME,

        // Maximum time to wait for CAPTCHA resolution in milliseconds (5 minutes)
        captchaTimeout: ENV.CRAWLER_CAPTCHA_TIMEOUT,

        // Maximum number of CAPTCHA resolution attempts
        maxCaptchaAttempts: ENV.CRAWLER_MAX_CAPTCHA_ATTEMPTS,

        // Time to wait between actions to appear more human-like (ms)
        humanDelayMin: ENV.CRAWLER_HUMAN_DELAY_MIN,
        humanDelayMax: ENV.CRAWLER_HUMAN_DELAY_MAX,
    },

    // Paths for saving data and screenshots
    paths: {
        screenshots: ENV.PATH_SCREENSHOTS,
        data: ENV.PATH_DATA,
    },

    // Optional: Proxy settings
    proxy: {
        enabled: ENV.PROXY_ENABLED,
        url: ENV.PROXY_URL,
    },
    // FILTERS
    filters: {
        region: ENV.FILTER_REGION,
        industry: ENV.FILTER_INDUSTRY,
        objective: ENV.FILTER_OBJECTIVE,
        period: ENV.FILTER_PERIOD,
        adLanguage: ENV.FILTER_AD_LANGUAGE,
        adFormat: ENV.FILTER_AD_FORMAT,
        likes: ENV.FILTER_LIKES,
    },

    // User agent settings
    userAgent: {
        // Set to true to use a custom user agent
        useCustom: ENV.USER_AGENT_USE_CUSTOM,
        // Custom user agent string
        custom: ENV.USER_AGENT_CUSTOM || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
    },
};

export type Config = typeof config;
export type FilterConfig = Config['filters'];
export type CrawlerConfig = Config['crawler'];
export type PathsConfig = Config['paths'];
export type ProxyConfig = Config['proxy'];
export type UserAgentConfig = Config['userAgent'];
