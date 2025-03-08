import { Page } from "playwright";
import { scrollNaturally } from "../helpers/index.js";
import { delay } from "../steps.js";

/**
 * Выполняет прокрутку страницы заданное количество раз с интервалом
 * и делает скриншоты через определенные интервалы для отладки
 * 
 * @param page - экземпляр страницы Playwright
 * @param scrollCount - количество прокруток (по умолчанию 20)
 * @param delayBetweenScrolls - задержка между прокрутками в мс (по умолчанию 10000)
 * @param screenshotInterval - интервал для создания скриншотов (по умолчанию каждые 5 прокруток)
 */
export const scrollAndCollectData = async (
    page: Page,
    scrollCount: number = 20,
    delayBetweenScrolls: number = 10000,
    screenshotInterval: number = 5
) => {
    const log = console; // Используем console как логгер, если нет доступа к логгеру Crawlee

    log.info('Начинаем процесс прокрутки страницы и сбора данных...');
    
    // Используем for-цикл вместо for-of для лучшего контроля
    for (let i = 0; i < scrollCount; i++) {
        log.info(`Прокрутка ${i + 1} из ${scrollCount}`);

        try {
            await scrollNaturally(page, 15, 150, 350, 800, 2000, 600);            
            // Сделаем скриншот после каждой прокрутки для отладки
            if (i % screenshotInterval === 0) {
                await page.screenshot({
                    path: `storage/screenshots/scroll-${i + 1}.png`,
                    fullPage: false
                });
            }

            // Ждем указанное время между прокрутками
            await delay(delayBetweenScrolls);
        } catch (scrollError) {
            log.error(`Ошибка при прокрутке ${i + 1}:`, { error: (scrollError as Error).message });
            // Продолжаем со следующей прокруткой, не прерывая весь процесс
        }
    }
};
