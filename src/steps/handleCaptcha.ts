import { Page } from 'playwright';
import { Log } from 'crawlee';

/**
 * Check for CAPTCHA and wait for user to solve it manually
 * @param page - Playwright page object
 * @param log - Logger instance
 * @returns Promise<boolean> - Whether CAPTCHA was detected and handled
 */
export async function handleCaptcha(page: Page, log: Log): Promise<boolean> {
    try {
        log.info('Checking for CAPTCHA...');
        
        // Take a screenshot to help with debugging
        await page.screenshot({ path: 'storage/screenshots/captcha-check.png' });
        
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
            const visibleSelector = await page.waitForSelector(selector, { timeout: 1000 });
            const isVisible = await visibleSelector.isVisible().catch(() => false);
            if (isVisible) {
                captchaDetected = true;
                log.info(`CAPTCHA detected with selector: ${selector}`);
                break;
            }
        }
        
        if (captchaDetected) {
            // Take a screenshot of the CAPTCHA
            await page.screenshot({ path: 'storage/screenshots/captcha-detected.png' });
            
            log.warning('CAPTCHA detected! Waiting for manual intervention...');
            
            // Display a message for the user
            await page.evaluate(() => {
                const messageDiv = document.createElement('div');
                messageDiv.id = 'manual-captcha-message';
                messageDiv.style.position = 'fixed';
                messageDiv.style.top = '10px';
                messageDiv.style.left = '10px';
                messageDiv.style.padding = '15px';
                messageDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
                messageDiv.style.color = 'white';
                messageDiv.style.fontWeight = 'bold';
                messageDiv.style.fontSize = '18px';
                messageDiv.style.zIndex = '9999';
                messageDiv.style.borderRadius = '5px';
                
                messageDiv.textContent = 'CAPTCHA DETECTED! Please solve it manually and press Enter when done.';
                
                // Add a button for users who prefer clicking
                const doneButton = document.createElement('button');
                doneButton.id = 'captcha-solved-button';
                doneButton.textContent = 'I\'ve solved the CAPTCHA';
                doneButton.style.display = 'block';
                doneButton.style.marginTop = '10px';
                doneButton.style.padding = '8px 15px';
                doneButton.style.backgroundColor = 'white';
                doneButton.style.color = 'black';
                doneButton.style.border = 'none';
                doneButton.style.borderRadius = '3px';
                doneButton.style.cursor = 'pointer';
                
                messageDiv.appendChild(doneButton);
                document.body.appendChild(messageDiv);
            });
            
            log.info('Waiting for user to solve CAPTCHA manually...');
            
            // Wait for user to press Enter or click the button
            await Promise.race([
                page.waitForSelector('#captcha-solved-button', { state: 'attached' })
                    .then(() => page.click('#captcha-solved-button'))
                    .catch(() => {}),
                page.waitForFunction(() => {
                    return new Promise(resolve => {
                        const handleKeyDown = (e: KeyboardEvent) => {
                            if (e.key === 'Enter') {
                                document.removeEventListener('keydown', handleKeyDown);
                                resolve(true);
                            }
                        };
                        document.addEventListener('keydown', handleKeyDown);
                    });
                }).catch(() => {})
            ]);
            
            // Remove the message div
            await page.evaluate(() => {
                const messageDiv = document.getElementById('manual-captcha-message');
                if (messageDiv) {
                    messageDiv.remove();
                }
            });
            
            // Wait a moment for any animations to complete
            await page.waitForTimeout(2000);
            
            log.info('Resuming after CAPTCHA intervention');
            return true;
        } else {
            log.info('No CAPTCHA detected');
            return false;
        }
    } catch (error) {
        log.error('Error in CAPTCHA handling:', { error: (error as Error).message });
        return false;
    }
}