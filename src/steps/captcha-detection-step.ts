import { Page } from 'playwright';
import { Log } from 'crawlee';
import { CaptchaDetectionService } from '../services/captchaDetectionService.js';

interface CaptchaCheckResult {
    detected: boolean;
    screenshotPath: string | null;
    selector: string;
}

/**
 * Check for CAPTCHA presence on the page and attempt to solve it
 * @param page - Playwright page object
 * @param log - Logger instance
 * @returns Promise<CaptchaCheckResult> - Whether CAPTCHA was detected, path to screenshot, and if it was solved
 */
export async function checkForCaptcha(page: Page, log: Log): Promise<CaptchaCheckResult> {
    try {
        const detector = new CaptchaDetectionService(log);
        const result = await detector.detectCaptcha(page);
        
        return {
            detected: result.detected,
            screenshotPath: result.screenshotPath,
            selector: result.selector
        };
    } catch (error) {
        log.error('Error in CAPTCHA detection:', { error: (error as Error).message });
        throw new Error(`CAPTCHA detection failed: ${(error as Error).message}`);
    }
}