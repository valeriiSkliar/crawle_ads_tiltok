import { Log } from "crawlee";
import { Page } from "playwright";

/**
 * Handles the TikTok cookie consent banner by clicking the "Allow all" button
 * @param page - Playwright page object
 * @param log - Crawlee logger
 * @returns Promise that resolves when the operation is complete
 */
export async function handleCookieConsent(page: Page, log: Log): Promise<void> {
    log.info('Handling cookie consent banner');
    try {
        // Look for the "Allow all" button within the cookie banner
        const allowAllButton = await page.locator('div.tiktok-cookie-banner button:has-text("Allow all")');
        
        // Check if the button exists and click it
        if (await allowAllButton.count() > 0) {
            log.info('Clicking "Allow all" button');
            await allowAllButton.click();
            log.info('Successfully clicked "Allow all" button');
            
            // Wait a moment for the banner to disappear
            await page.waitForTimeout(2000);
        } else {
            log.warning('Could not find "Allow all" button in the cookie banner');
        }
    } catch (error: unknown) {
        // Take a screenshot to help debug
        await page.screenshot({ path: 'storage/screenshots/cookie-consent-error.png' });
        log.error('Error handling cookie consent:', { error: error instanceof Error ? error.message : String(error) });
    }
}
