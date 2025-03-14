import { Page } from "playwright";
import { scrollNaturally, delay, randomBetween } from "../helpers/index.js";
import { Log } from "crawlee";
import { PaginationService } from "../services/paginationService.js";

/**
 * Выполняет прокрутку страницы на основе данных о пагинации
 * с естественными задержками между прокрутками
 * 
 * @param page - экземпляр страницы Playwright
 * @param paginationService - сервис для работы с пагинацией
 * @param log - инстанс логгера
 * @param delayBetweenScrolls - базовая задержка между прокрутками в мс (по умолчанию 2500)
 */
export const scrollAndCollectData = async (
    page: Page,
    paginationService: PaginationService,
    log: Log,
    delayBetweenScrolls: number = 2500
) => {
    const requiredScrolls = paginationService.getRequiredScrolls();
    log.info('Начинаем процесс прокрутки страницы и сбора данных...', {
        requiredScrolls
    });
    
    for (let i = 0; i < requiredScrolls; i++) {
        const progress = paginationService.getCurrentProgress();
        log.info(`Прокрутка ${progress.current} из ${progress.total}`);

        try {
            // Естественная прокрутка с случайными параметрами
            await scrollNaturally(
                page,
                randomBetween(10, 20),  // steps
                randomBetween(100, 200), // minStep
                randomBetween(300, 400), // maxStep
                randomBetween(600, 1000), // minDelay
                randomBetween(500, 1500), // maxDelay
                randomBetween(500, 700)  // initialDelay
            );            

            // Случайная задержка между прокрутками для имитации человеческого поведения
            const randomDelay = randomBetween(
                delayBetweenScrolls * 0.8,
                delayBetweenScrolls * 1.2
            );
            await delay(randomDelay);
            
        } catch (scrollError) {
            log.error(`Ошибка при прокрутке ${i + 1}:`, { 
                error: (scrollError as Error).message,
                currentScroll: i + 1,
                totalScrolls: requiredScrolls
            });
            // Продолжаем со следующей прокруткой, не прерывая весь процесс
        }
    }
};
