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
            // const solvedPath = path.join('storage/screenshots', `captcha-solved-${new Date().toISOString().replace(/[:.]/g, '-')}.png`);
            // await page.screenshot({ path: solvedPath });
        //     return true;
        }

        // If captcha was solved automatically, click the confirm button
        // if (solved) {
        //     log.info('Captcha solved automatically, clicking confirm button...');
        //     try {
        //         // Wait for the confirm button to be visible and click it
        //         const confirmButton = await page.waitForSelector('.verify-captcha-submit-button', { timeout: 5000 });
        //         if (confirmButton) {
        //             await confirmButton.click();
        //             log.info('Confirm button clicked successfully');
        //             // Wait a moment to ensure the action is processed
        //             await page.waitForTimeout(2000);
        //             return true;
        //         }
        //     } catch (error) {
        //         log.error('Failed to click confirm button:', { error: (error as Error).message });
        //     }
        // }
        
        // log.warning(`CAPTCHA detected but not solved automatically. Screenshot saved at: ${screenshotPath}`);
        
        // log.info('Waiting for user to click continue...');
        
        // Setup for detecting button click
        const buttonClicked = false;
        
        // Setup the click event with exposeFunction to avoid complex browser context evaluation
        // await page.exposeFunction('notifyContinue', () => {
        //     buttonClicked = true;
        // });
        
        // const logInstance = new Log({ prefix: 'CaptchaHandler' });

        // Add the click listener to the button
        // await page.evaluate(() => {
        //     const button = document.getElementById('continue-button');
        //     const confirmButton = document.querySelector('.verify-captcha-submit-button');
        //     const refreshButton = document.querySelector('.secsdk_captcha_refresh');
            
        //     // Log button presence for debugging
        //     console.log({
        //         continueButtonPresent: !!button,
        //         confirmButtonPresent: !!confirmButton,
        //         refreshButtonPresent: !!refreshButton
        //     });

        //     if (button) {
        //         button.addEventListener('click', () => {
        //             console.log('Continue button clicked');
        //             window.notifyContinue();
        //         });
        //     }
            
        //     if (confirmButton) {
        //         confirmButton.addEventListener('click', () => {
        //             console.log('Confirm button clicked');
        //             window.notifyContinue();
        //         });
        //     }

        //     if (refreshButton) {
        //         refreshButton.addEventListener('click', () => {
        //             console.log('Refresh button clicked');
        //             if (window.notifyRefresh) {
        //                 window.notifyRefresh();
        //             }
        //         });
        //     }
        // });

        // logInstance.info('Added event listeners to captcha buttons');
        
        // Poll until the button is clicked
        const startTime = Date.now();
        const maxWaitTime = 3600000; // 1 hour in milliseconds
        
        while (!buttonClicked && (Date.now() - startTime < maxWaitTime)) {
            await page.waitForTimeout(500); // Check every 500ms
        }
        
        if (!buttonClicked) {
            throw new Error('Timed out waiting for user to click continue button.');
        }
        
        // Allow user to see the "continuing" message briefly
        // await page.waitForTimeout(2000);
        
        // Remove the notification
        // await page.evaluate(() => {
        //     const notification = document.getElementById('captcha-notification');
        //     if (notification) {
        //         notification.remove();
        //         document.body.style.overflow = ''; // Restore scrolling
        //     }
        // });
        
        log.info('Resuming process after manual intervention');
        return true;
    } catch (error) {
        // Critical error handling
        log.error('CRITICAL ERROR in CAPTCHA handling:', { error: (error as Error).message });
        
        // Re-throw the error to make the calling function abort
        throw new Error(`CAPTCHA handling failed: ${(error as Error).message}. Process aborted.`);
    }
}