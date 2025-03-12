import fs from 'fs';
import { Page } from 'playwright';
import { API_RESPONSES_DIR } from '../consts.js';
import { TikTokApiResponse } from '../types/api.js';
import { Log } from 'crawlee';

interface RequestInterceptionOptions {
    onResponse?: (response: TikTokApiResponse) => void;
    log?: Log;
}

/**
 * Настраивает перехват запросов к API TikTok Ads для сохранения ответов
 * и обработки данных пагинации
 * 
 * @param page - экземпляр страницы Playwright
 * @param options - опции для настройки перехвата
 */
export const setupRequestInterception = async (
    page: Page,
    options: RequestInterceptionOptions = {}
) => {
    const { onResponse, log } = options;

    await page.route('**/creative_radar_api/v1/top_ads/v2/list**', async (route) => {
        try {
            // Продолжаем запрос и получаем ответ
            const response = await route.fetch();
            const responseBody = await response.json() as TikTokApiResponse;
            
            // Создаем уникальное имя файла на основе параметров запроса и времени
            const url = new URL(route.request().url());
            const params = Object.fromEntries(url.searchParams.entries());
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `${API_RESPONSES_DIR}/ads_response_${params.adLanguage || 'unknown'}_page${params.page || '0'}_${timestamp}.json`;
            
            // Сохраняем ответ в JSON файл
            fs.writeFileSync(fileName, JSON.stringify(responseBody, null, 2));

            // Вызываем callback для обработки пагинации, если он предоставлен
            if (onResponse) {
                onResponse(responseBody);
            }

            if (log) {
                log.info('Получен и сохранен ответ от API', {
                    page: params.page,
                    totalItems: responseBody.data.pagination.total_count,
                    currentPageItems: responseBody.data.materials.length
                });
            }
            
            // Продолжаем обработку запроса как обычно
            await route.continue();
        } catch (error) {
            if (log) {
                log.error('Ошибка при обработке ответа API:', {
                    error: (error as Error).message
                });
            }
            await route.continue();
        }
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