import { Log } from "crawlee";
import { Page } from "playwright";

/**
 * Clicks on the login button to initiate the login process
 * @param page - Playwright page object
 * @param log - Crawlee logger
 * @returns Promise that resolves when the operation is complete
 */
export async function clickLoginButton(page: Page, log: Log): Promise<void> {
    log.info('Attempting to click on login button');
    try {
        // Wait for the login button to be visible
        await page.waitForSelector('div[data-testid="cc_header_login"]', { timeout: 10000 });
        
        // Find the login button using the data-testid attribute
        const loginButton = await page.locator('div[data-testid="cc_header_login"]');
        
        // Check if the button exists and click it
        if (await loginButton.count() > 0) {
            log.info('Clicking login button');
            await loginButton.click();
            log.info('Successfully clicked login button');
            
            // Wait a moment for the login page/modal to load
            // await page.waitForTimeout(3000);
        } else {
            // Try alternative selector if the first one doesn't work
            const altLoginButton = await page.locator('div.FixedHeaderPc_loginBtn__lL73Y');
            
            if (await altLoginButton.count() > 0) {
                log.info('Clicking login button (using alternative selector)');
                await altLoginButton.click();
                log.info('Successfully clicked login button');
                
                // Wait a moment for the login page/modal to load
                await page.waitForTimeout(3000);
            } else {
                log.warning('Could not find login button');
            }
        }
    } catch (error: unknown) {
        // Take a screenshot to help debug
        await page.screenshot({ path: 'storage/screenshots/login-button-error.png' });
        log.error('Error clicking login button:', { error: error instanceof Error ? error.message : String(error) });
    }
}