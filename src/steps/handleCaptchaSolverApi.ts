import { Page } from 'playwright';
import { Log } from 'crawlee';
import { checkForCaptcha } from './captcha-detection-step.js';
import { SadCaptchaService } from '@src/services/sadCaptchaService.js';

declare global {
    interface Window {
        notifyContinue: () => void;
        notifyRefresh?: () => void;
    }
}

/**
 * Handle CAPTCHA and wait for user to solve it manually if detected
 * @param page - Playwright page object
 * @param log - Logger instance
 * @returns Promise<boolean> - Whether CAPTCHA was handled successfully
 */
export async function handleCaptchaSolverApi(page: Page, log: Log): Promise<boolean> {
    try {
        // Check for CAPTCHA presence
        const { detected, screenshotPath, selector } = await checkForCaptcha(page, log);
        
        // If no CAPTCHA is detected, return early
        if (!detected || !screenshotPath || !selector) {
            log.info('No CAPTCHA detected, continuing process.');
            return false;
        }

        log.warning('CAPTCHA detected! Attempting to solve...');
        const solver = new SadCaptchaService(log);
        const solved = await solver.solveCaptcha(page, selector, screenshotPath);
        
        if (solved) {
            log.info('CAPTCHA solved successfully!');
        }
        let buttonClicked = false;
        
        // Poll until the button is clicked
        const startTime = Date.now();
        const maxWaitTime = 3600000; // 1 hour in milliseconds
        
        while (!buttonClicked && (Date.now() - startTime < maxWaitTime)) {
            await page.waitForTimeout(500); // Check every 500ms
            const confirmButton = await page.waitForSelector('div.verify-captcha-submit-button', { timeout: 5000 });
            if (confirmButton) {
                buttonClicked = true;
                await confirmButton.click();
                log.info('Confirm button clicked successfully', { buttonClicked });
                // Wait a moment to ensure the action is processed
                await page.waitForTimeout(2000);
                return true;
            }
        }
        
        if (!buttonClicked) {
            throw new Error('Timed out waiting for user to click continue button.');
        }
        
        log.info('Resuming process after manual intervention');
        return true;
    } catch (error) {
        // Critical error handling
        log.error('CRITICAL ERROR in CAPTCHA handling:', { error: (error as Error).message });
        
        // Re-throw the error to make the calling function abort
        throw new Error(`CAPTCHA handling failed: ${(error as Error).message}. Process aborted.`);
    }
}