import { Page } from 'playwright';
import { Log } from 'crawlee';
import path from 'path';

export interface CaptchaCheckResult {
    detected: boolean;
    selector: string;
    screenshotPath: string | null;
}

export class CaptchaDetectionService {
    private readonly captchaSelectors = [
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

    private readonly captchaImageSelectors = [
        '#captcha-verify-image',
        'img.sc-gqjmRU',
        'img.cHbGdz',
        'img.sc-ifAKCX',
        'img.itlNmx'
    ];

    constructor(private readonly log: Log) {}

    /**
     * Check for CAPTCHA presence on the page
     * @param page - Playwright page object
     * @returns Promise<CaptchaCheckResult> - Whether CAPTCHA was detected and path to screenshot
     */
    async detectCaptcha(page: Page): Promise<CaptchaCheckResult> {
        try {
            this.log.info('Checking for CAPTCHA...');
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const screenshotDir = 'storage/screenshots';
            const screenshotPath = path.join(screenshotDir, `captcha-detection-${timestamp}.png`);
            
            let captchaDetected = false;
            let captchaSelector = '';
            let visibleSelector;
            for (const imgSelector of this.captchaImageSelectors) {
                try {
                    visibleSelector = await page.waitForSelector(imgSelector, { timeout: 1000 });
                    if (visibleSelector && await visibleSelector.isVisible()) {
                        captchaSelector = imgSelector;
                        await visibleSelector.screenshot({ path: screenshotPath });
                        this.log.info(`CAPTCHA image found and screenshot taken with selector: ${imgSelector}`);
                        captchaDetected = true;
                        break;
                    }
                } catch {
                    continue;
                }
            }
            
            // // First check for the container to detect captcha presence
            // for (const selector of this.captchaSelectors) {
            //     try {
            //         visibleSelector = await page.waitForSelector(selector, { timeout: 1000 });
            //         const isVisible = await visibleSelector?.isVisible();
            //         if (isVisible) {
            //             captchaDetected = true;
                        
            //             // Now find and screenshot the actual captcha image
            //             for (const imgSelector of this.captchaImageSelectors) {
            //                 try {
            //                     const imageElement = await page.waitForSelector(imgSelector, { timeout: 1000 });
            //                     if (imageElement && await imageElement.isVisible()) {
            //                         captchaSelector = imgSelector;
            //                         await imageElement.screenshot({ path: screenshotPath });
            //                         this.log.info(`CAPTCHA image found and screenshot taken with selector: ${imgSelector}`);
            //                         break;
            //                     }
            //                 } catch {
            //                     continue;
            //                 }
            //             }
                        
            //             this.log.info(`CAPTCHA detected with selector: ${captchaSelector}`);
            //             break;
            //         }
            //     } catch {
            //         continue;
            //     }
            // }

            return {
                detected: captchaDetected,
                selector: captchaSelector,
                screenshotPath: captchaDetected ? screenshotPath : null
            };
            
        } catch (error) {
            this.log.error('Error in CAPTCHA detection:', { error: (error as Error).message });
            throw new Error(`CAPTCHA detection failed: ${(error as Error).message}`);
        }
    }
}
