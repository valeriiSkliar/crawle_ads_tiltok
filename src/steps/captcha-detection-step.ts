import { Page } from 'playwright';
import { Log } from 'crawlee';
import path from 'path';
import { SadCaptchaService } from '../services/sadCaptchaService.js';

interface CaptchaCheckResult {
    detected: boolean;
    screenshotPath: string;
    solved?: boolean;
}

/**
 * Check for CAPTCHA presence on the page and attempt to solve it
 * @param page - Playwright page object
 * @param log - Logger instance
 * @returns Promise<CaptchaCheckResult> - Whether CAPTCHA was detected, path to screenshot, and if it was solved
 */
export async function checkForCaptcha(page: Page, log: Log): Promise<CaptchaCheckResult> {
    try {
        log.info('Checking for CAPTCHA...');
        
        // Create screenshot filename with timestamp to avoid overwriting
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const screenshotDir = 'storage/screenshots';
        const screenshotPath = path.join(screenshotDir, `captcha-check-${timestamp}.png`);
        
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
        let captchaSelector = '';
        let visibleSelector;
        
        for (const selector of captchaSelectors) {
            try {
                visibleSelector = await page.waitForSelector(selector, { timeout: 1000 });
                const isVisible = await visibleSelector?.isVisible();
                if (isVisible) {
                    await visibleSelector.screenshot({ path: screenshotPath });
                    captchaDetected = true;
                    captchaSelector = selector;
                    log.info(`CAPTCHA detected with selector: ${selector}`);
                    break;
                }
            } catch (err: unknown) {
                log.debug(`CAPTCHA selector check failed: ${(err as Error).message}`);
                // Continue checking other selectors - timeout is expected for non-matching selectors
            }
        }
        
        if (captchaDetected && visibleSelector) {
            log.warning('CAPTCHA detected! Attempting to solve...');
            const sadCaptchaService = new SadCaptchaService(log);
            
            // Take a screenshot before attempting solution
            const captchaScreenshotPath = path.join(screenshotDir, `captcha-detected-${timestamp}.png`);
            await page.screenshot({ path: captchaScreenshotPath });
            
            // Attempt to solve the captcha
            const solved = await sadCaptchaService.solveCaptcha(page, captchaSelector);
            
            if (solved) {
                log.info('CAPTCHA solved successfully!');
                // Take a screenshot after solution attempt
                const solvedScreenshotPath = path.join(screenshotDir, `captcha-solved-${timestamp}.png`);
                await page.screenshot({ path: solvedScreenshotPath });
                return { detected: true, screenshotPath: solvedScreenshotPath, solved: true };
            } else {
                log.error('Failed to solve CAPTCHA');
                return { detected: true, screenshotPath: captchaScreenshotPath, solved: false };
            }
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