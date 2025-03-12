import { Page } from "playwright";
import { delay } from "../helpers/index.js";

// Функция для прокрутки страницы до нижней границы
export const scrollToBottom = async (page: Page) => {
    await page.evaluate(() => {
        window.scrollTo({ top: document.body.scrollHeight - 200, behavior: "smooth" });
    });
};

/**
 * Функция для естественной прокрутки страницы, имитирующая поведение человека
 * Прокручивает страницу постепенно с небольшими случайными вариациями
 * @param page - экземпляр страницы Playwright
 * @param maxScrolls - максимальное количество прокруток (по умолчанию 10)
 * @param minScrollPixels - минимальное количество пикселей для прокрутки за раз (по умолчанию 100)
 * @param maxScrollPixels - максимальное количество пикселей для прокрутки за раз (по умолчанию 300)
 * @param minDelay - минимальная задержка между прокрутками в мс (по умолчанию 500)
 * @param maxDelay - максимальная задержка между прокрутками в мс (по умолчанию 1500)
 * @param bottomMargin - отступ от нижней границы страницы в пикселях (по умолчанию 500)
 */
export const scrollNaturally = async (
    page: Page, 
    maxScrolls: number = 10, 
    minScrollPixels: number = 100,
    maxScrollPixels: number = 300,
    minDelay: number = 500,
    maxDelay: number = 1500,
    bottomMargin: number = 500
) => {
    // Получаем текущую высоту страницы и позицию прокрутки
    const pageMetrics = await page.evaluate(() => {
        return {
            scrollHeight: document.body.scrollHeight,
            scrollTop: window.pageYOffset || document.documentElement.scrollTop,
            windowHeight: window.innerHeight
        };
    });
    
    let currentScrollTop = pageMetrics.scrollTop;
    const maxScrollTop = pageMetrics.scrollHeight - pageMetrics.windowHeight - bottomMargin;
    let scrollCount = 0;
    
    // Продолжаем прокрутку, пока не достигнем нижней границы или максимального количества прокруток
    while (currentScrollTop < maxScrollTop && scrollCount < maxScrolls) {
        // Генерируем случайное значение для прокрутки
        const scrollAmount = Math.floor(Math.random() * (maxScrollPixels - minScrollPixels + 1)) + minScrollPixels;
        
        // Вычисляем новую позицию прокрутки, но не прокручиваем дальше максимально допустимой позиции
        const newScrollTop = Math.min(currentScrollTop + scrollAmount, maxScrollTop);
        
        // Выполняем прокрутку с плавным эффектом
        await page.evaluate((scrollTo) => {
            window.scrollTo({
                top: scrollTo,
                behavior: 'smooth'
            });
        }, newScrollTop);
        
        // Обновляем текущую позицию прокрутки
        currentScrollTop = newScrollTop;
        scrollCount++;
        
        // Случайная задержка между прокрутками для имитации человеческого поведения
        const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
        await delay(randomDelay);
        
        // Иногда делаем небольшую паузу, как будто человек остановился, чтобы прочитать контент
        if (Math.random() < 0.3) { // 30% вероятность сделать дополнительную паузу
            await delay(Math.floor(Math.random() * 2000) + 1000); // Пауза от 1 до 3 секунд
        }
    }
    
    console.log(`Естественная прокрутка завершена: ${scrollCount} прокруток выполнено`);
    return scrollCount;
};

// Функция для очистки выбранных элементов в мультиселекте
// async function clearFilterSelections(page: Page, filter: FilterElement): Promise<void> {
//   console.log(`Clearing selections for filter "${filter.name}"`);
  
//   try {
//     // Click on the filter to open the dropdown
//     await page.click(filter.selector);
//     await delay(500);
    
//     // Find all close buttons for selected items
//     const closeButtons = await page.$$(`${filter.selector} .CcMultiSelect_ccItemLabelClose__F3dTP`);
    
//     if (closeButtons.length > 0) {
//       console.log(`Found ${closeButtons.length} selected items to clear`);
      
//       // Click each close button to remove the selection
//       for (const button of closeButtons) {
//         await button.click();
//         await delay(300); // Small delay between clicks
//       }
      
//       // Click outside to close the dropdown
//       await page.click('body', { position: { x: 10, y: 10 } });
//       await delay(500);
//     } else {
//       console.log('No selections to clear');
//       // Close the dropdown by clicking outside
//       await page.click('body', { position: { x: 10, y: 10 } });
//     }
//   } catch (error) {
//     console.error(`Error clearing selections for filter "${filter.name}":`, error);
//     throw error;
//   }
// }  