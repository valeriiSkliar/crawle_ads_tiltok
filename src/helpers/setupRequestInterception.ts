import fs from 'fs';
import { Page } from 'playwright';
import { API_RESPONSES_DIR } from '../consts.js';
import { TikTokApiResponse, TikTokAdMaterial } from '../types/api.js';
import { Log } from 'crawlee';
import { createDatabase } from '@src/services/database/factory.js';
import { Env } from '@lib/Env.js';

interface RequestInterceptionOptions {
    /**
     * Callback function to process API responses.
     * @param response - API response data
     */
    onResponse?: (response: TikTokApiResponse) => void;
    /**
     * Logger instance for logging messages.
     */
    log?: Log;
}

/**
 * Maps TikTokAdMaterial to our database AdData format
 */
const mapToAdData = (material: TikTokAdMaterial, countryCode: string) => {
    return {
        id: material.id,
        countryCode,
        creativeId: material.id, // Using the same ID as creative ID since TikTok API doesn't provide a separate one
        advertiserId: material.brand_name, // Using brand_name as advertiser ID
        advertiserName: material.brand_name,
        metadata: {
            adTitle: material.ad_title,
            cost: material.cost,
            ctr: material.ctr,
            favorite: material.favorite,
            industryKey: material.industry_key,
            isSearch: material.is_search,
            like: material.like,
            objectiveKey: material.objective_key,
            tag: material.tag
        },
        videoInfo: material.video_info ? {
            vid: material.video_info.vid,
            duration: material.video_info.duration,
            cover: material.video_info.cover,
            width: material.video_info.width,
            height: material.video_info.height,
            videoUrl: {
                p720: material.video_info.video_url['720p']
            }
        } : undefined
    };
};

/**
 * Sets up request interception for TikTok Ads API to save responses
 * and process pagination data
 * 
 * @param page - Playwright page instance
 * @param options - Interception options
 */
export const setupRequestInterception = async (
    page: Page,
    options: RequestInterceptionOptions = {}
) => {
    const { onResponse, log } = options;
    // Use DATABASE_SQLITE_URL from environment for Prisma
    const db = await createDatabase('prisma', {
        connectionString: Env.DATABASE_SQLITE_URL,
    });
    await db.connect();

    await page.route('**/creative_radar_api/v1/top_ads/v2/list**', async (route) => {
        try {
            // Continue the request and get response
            const response = await route.fetch();
            const responseBody = await response.json() as TikTokApiResponse;
            
            // Create unique filename based on request parameters and timestamp
            const url = new URL(route.request().url());
            const params = Object.fromEntries(url.searchParams.entries());
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `${API_RESPONSES_DIR}/ads_response_${params.adLanguage || 'unknown'}_page${params.page || '0'}_${timestamp}.json`;
            
            // Save response to JSON file
            fs.writeFileSync(fileName, JSON.stringify(responseBody, null, 2));

            // Save each ad to database
            const countryCode = params.region || 'unknown';
            for (const material of responseBody.data.materials) {
                try {
                    const adData = mapToAdData(material, countryCode);
                    const isDuplicate = await db.isDuplicate(adData);
                    
                    if (!isDuplicate) {
                        await db.insertAd(adData);
                        if (log) {
                            log.info('Saved new ad to database', { id: adData.id });
                        }
                    } else if (log) {
                        log.debug('Skipped duplicate ad', { id: adData.id });
                    }
                } catch (error) {
                    if (log) {
                        log.error('Error saving ad to database:', {
                            id: material.id,
                            error: (error as Error).message
                        });
                    }
                }
            }

            // Call callback for pagination processing if provided
            if (onResponse) {
                onResponse(responseBody);
            }

            if (log) {
                log.info('Received and processed API response', {
                    page: params.page,
                    totalItems: responseBody.data.pagination.total_count,
                    currentPageItems: responseBody.data.materials.length
                });
            }
            
            // Continue request processing as usual
            await route.continue();
        } catch (error) {
            if (log) {
                log.error('Error processing API response:', {
                    error: (error as Error).message
                });
            }
            await route.continue();
        }
    });

    // Cleanup function to disconnect from database
    page.once('close', async () => {
        await db.disconnect();
    });
};

export const checkApiResponsesFolderExistence = () => {
    try {
        if (!fs.existsSync(API_RESPONSES_DIR)) {
            fs.mkdirSync(API_RESPONSES_DIR, { recursive: true });
        }
    } catch (error) {
        console.error('Error creating API responses directory:', error);
    }
};