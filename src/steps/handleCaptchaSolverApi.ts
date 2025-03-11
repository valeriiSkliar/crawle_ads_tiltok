import { Page } from 'playwright';
import { Log } from 'crawlee';
import { checkForCaptcha } from './captcha-detection-step.js';

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
        const { detected, screenshotPath } = await checkForCaptcha(page, log);
        
        // If no CAPTCHA is detected, return early
        if (!detected) {
            log.info('No CAPTCHA detected, continuing process.');
            return false;
        }
        
        log.warning(`CAPTCHA detected! Process paused for manual intervention. Screenshot saved at: ${screenshotPath}`);
        
        // Take a pause screenshot showing current state
        // await page.screenshot({ path: 'storage/screenshots/process-paused.png' });
        
        log.info('Waiting for user to click continue...');
        
        // Setup for detecting button click
        let buttonClicked = false;
        
        // Setup the click event with exposeFunction to avoid complex browser context evaluation
        await page.exposeFunction('notifyContinue', () => {
            buttonClicked = true;
        });
        
        const logInstance = new Log({ prefix: 'CaptchaHandler' });

        // Add the click listener to the button
        await page.evaluate(() => {
            const button = document.getElementById('continue-button');
            const confirmButton = document.querySelector('.verify-captcha-submit-button');
            const refreshButton = document.querySelector('.secsdk_captcha_refresh');
            
            // Log button presence for debugging
            console.log({
                continueButtonPresent: !!button,
                confirmButtonPresent: !!confirmButton,
                refreshButtonPresent: !!refreshButton
            });

            if (button) {
                button.addEventListener('click', () => {
                    console.log('Continue button clicked');
                    window.notifyContinue();
                });
            }
            
            if (confirmButton) {
                confirmButton.addEventListener('click', () => {
                    console.log('Confirm button clicked');
                    window.notifyContinue();
                });
            }

            if (refreshButton) {
                refreshButton.addEventListener('click', () => {
                    console.log('Refresh button clicked');
                    if (window.notifyRefresh) {
                        window.notifyRefresh();
                    }
                });
            }
        });

        logInstance.info('Added event listeners to captcha buttons');
        
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
        await page.waitForTimeout(2000);
        
        // Remove the notification
        await page.evaluate(() => {
            const notification = document.getElementById('captcha-notification');
            if (notification) {
                notification.remove();
                document.body.style.overflow = ''; // Restore scrolling
            }
        });
        
        log.info('Resuming process after manual intervention');
        return true;
    } catch (error) {
        // Critical error handling
        log.error('CRITICAL ERROR in CAPTCHA handling:', { error: (error as Error).message });
        
        // Re-throw the error to make the calling function abort
        throw new Error(`CAPTCHA handling failed: ${(error as Error).message}. Process aborted.`);
    }
}