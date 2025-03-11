import { Page } from 'playwright';
import { Log } from 'crawlee';
import path from 'path';

/**
 * Check for CAPTCHA presence on the page
 * @param page - Playwright page object
 * @param log - Logger instance
 * @returns Promise<{detected: boolean, screenshotPath: string}> - Whether CAPTCHA was detected and path to the screenshot
 */
export async function checkForCaptcha(page: Page, log: Log): Promise<{detected: boolean, screenshotPath: string}> {
    try {
        log.info('Checking for CAPTCHA...');
        
        // Create screenshot filename with timestamp to avoid overwriting
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const screenshotDir = 'storage/screenshots';
        const screenshotPath = path.join(screenshotDir, `captcha-check-${timestamp}.png`);
        
        // Take a screenshot to help with debugging
        await page.screenshot({ path: screenshotPath });
        
        // Common CAPTCHA selectors
        const captchaSelectors = [
            'div.captcha_verify_container',
            'div[class*="captcha"]',
            'iframe[src*="captcha"]',
            'div[id*="captcha"]',
            'img[src*="captcha"]',
            'div:has-text("Verify you are human")',
            'div:has-text("Security check")',
            'div:has-text("Please verify")',
            'div:has-text("Select 2 objects that are the same shape")'
        ];
        
        // Check for CAPTCHA presence
        let captchaDetected = false;
        
        for (const selector of captchaSelectors) {
            try {
                const visibleSelector = await page.waitForSelector(selector, { timeout: 1000 });
                const isVisible = await visibleSelector?.isVisible();
                if (isVisible) {
                    captchaDetected = true;
                    log.info(`CAPTCHA detected with selector: ${selector}`);
                    break;
                }
            } catch (err: unknown) {
                log.debug(`CAPTCHA selector check failed: ${(err as Error).message}`);
                // Continue checking other selectors - timeout is expected for non-matching selectors
            }
        }
        
        if (captchaDetected) {
            log.warning('CAPTCHA detected! Take appropriate action.');
            // Take an additional screenshot specifically showing the CAPTCHA
            const captchaScreenshotPath = path.join(screenshotDir, `captcha-detected-${timestamp}.png`);
            await page.screenshot({ path: captchaScreenshotPath });
            return { detected: true, screenshotPath: captchaScreenshotPath };
        } else {
            log.info('No CAPTCHA detected.');
            return { detected: false, screenshotPath: screenshotPath };
        }
    } catch (error) {
        // Error handling
        log.error('Error in CAPTCHA detection:', { error: (error as Error).message });
        throw new Error(`CAPTCHA detection failed: ${(error as Error).message}`);
    }
}