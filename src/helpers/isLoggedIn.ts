import { Log } from "crawlee";
import { Page } from "playwright";

// Функция для проверки, залогинены ли мы уже
export const isLoggedIn = async (page: Page, log: Log): Promise<boolean> => {
    await page.waitForTimeout(5000); 
    // Проверяем наличие элементов, которые видны только после входа
    log.info('Checking if logged in...');
    const loggedInSelectors = [
        'div[data-testid="cc_header_userInfo"]',
        '.UserDropDown_trigger__Ian3g',
        '.DefaultAvatar_wrapper__NpgQV',
        'div[id="HeaderLoginUserProfile"]',
        'div[class*="UserDropDown_trigger"]',
        'div[class*="DefaultAvatar_wrapper"]',
        'img[class*="avatar"]',
        'div[class*="avatar"]'
    ];
    
    for (const selector of loggedInSelectors) {
        const isVisible = await page.isVisible(selector, { timeout: 2000 }).catch(() => false);
        if (isVisible) {
            log.info('Logged in successfully');
            return true;
        }
    }
    
    return false;
};