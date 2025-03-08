import fs from 'fs';
import { Page } from 'playwright';
import { API_RESPONSES_DIR } from '../consts.js';

// Функция для перехвата запросов к API и сохранения ответов
export const setupRequestInterception = async (page: Page) => {
    await page.route('**/creative_radar_api/v1/top_ads/v2/list**', async (route) => {
        // Продолжаем запрос и получаем ответ
        const response = await route.fetch();
        const responseBody = await response.json();
        
        // Создаем уникальное имя файла на основе параметров запроса и времени
        const url = new URL(route.request().url());
        const params = Object.fromEntries(url.searchParams.entries());
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `${API_RESPONSES_DIR}/ads_response_${params.adLanguage || 'unknown'}_page${params.page || '0'}_${timestamp}.json`;
        
        // Сохраняем ответ в JSON файл
        fs.writeFileSync(fileName, JSON.stringify(responseBody, null, 2));
        
        // Продолжаем обработку запроса как обычно
        await route.continue();
    });
};

export const checkApiResponsesFolderExistence = async () => {
        
            // Создаем директорию для API-ответов, если она не существует
            try {
                if (!fs.existsSync(API_RESPONSES_DIR)) {
                    fs.mkdirSync(API_RESPONSES_DIR, { recursive: true });
                }
            } catch (error) {
                console.error('Error creating API responses directory:', error);
            }
        };