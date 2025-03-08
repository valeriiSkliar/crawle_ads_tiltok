import { Page } from "playwright";

// Функция для проверки, залогинены ли мы уже
export const isLoggedIn = async (page: Page): Promise<boolean> => {
    // Проверяем наличие элементов, которые видны только после входа
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
        const isVisible = await page.isVisible(selector).catch(() => false);
        if (isVisible) {
            return true;
        }
    }
    
    return false;
};