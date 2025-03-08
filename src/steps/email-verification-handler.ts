import { Page } from 'playwright';
import { Log } from 'crawlee';

/**
 * Check for email verification code form and wait for user to enter the code
 * @param page - Playwright page object
 * @param log - Logger instance
 * @returns Promise<boolean> - Whether verification was detected and handled
 */
export async function handleEmailCodeVerification(page: Page, log: Log): Promise<boolean> {
    try {
        log.info('Checking for email verification...');
        
        // Take a screenshot to help with debugging
        await page.screenshot({ path: 'storage/screenshots/verification-check.png' });
        
        // Email verification selectors
        const verificationSelectors = [
            'div.tiktokads-common-login-code-form',
            'input[placeholder="Enter verification code"]',
            'div:has-text("Verification code")',
            'div:has-text("For security reasons, a verification code has been sent to")',
            '#TikTok_Ads_SSO_Login_Code_Content'
        ];

        // Check for verification form presence
        let verificationDetected = false;
        
        for (const selector of verificationSelectors) {
            const visibleSelector = await page.waitForSelector(selector, { timeout: 3000 });

            const isVisible = await visibleSelector.isVisible().catch(() => false);
            if (isVisible) {
                verificationDetected = true;
                log.info(`Email verification detected with selector: ${selector}`);
                break;
            }
        }
        
        if (verificationDetected) {
            // Take a screenshot of the verification form
            await page.screenshot({ path: 'storage/screenshots/verification-detected.png' });
            
            // Try to get the email address to display to the user
            let emailAddress = "";
            try {
                emailAddress = await page.textContent('#TikTok_Ads_SSO_Login_Code_Email') || "";
            } catch (e) {
                log.debug('Could not get email address:', { error: (e as Error).message });
            }
            
            log.warning(`Email verification required${emailAddress ? ' for ' + emailAddress : ''}! Waiting for user input...`);
            
            // Display a message for the user
            await page.evaluate((email) => {
                const messageDiv = document.createElement('div');
                messageDiv.id = 'manual-verification-message';
                messageDiv.style.position = 'fixed';
                messageDiv.style.top = '10px';
                messageDiv.style.left = '10px';
                messageDiv.style.padding = '15px';
                messageDiv.style.backgroundColor = 'rgba(0, 100, 0, 0.8)';
                messageDiv.style.color = 'white';
                messageDiv.style.fontWeight = 'bold';
                messageDiv.style.fontSize = '18px';
                messageDiv.style.zIndex = '9999';
                messageDiv.style.borderRadius = '5px';
                messageDiv.style.maxWidth = '400px';
                
                messageDiv.innerHTML = `
                    <p>EMAIL VERIFICATION REQUIRED${email ? ' for <strong>' + email + '</strong>' : ''}!</p>
                    <p>Please check your email and enter the verification code in the form.</p>
                    <p>After entering the code and clicking the login button, press Enter or click below to continue.</p>
                `;
                
                // Add a button for users who prefer clicking
                const doneButton = document.createElement('button');
                doneButton.id = 'verification-completed-button';
                doneButton.textContent = 'I\'ve entered the verification code';
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
            }, emailAddress);
            
            log.info('Waiting for user to enter verification code...');
            
            // Wait for user to press Enter or click the button
            await Promise.race([
                page.waitForSelector('#verification-completed-button', { state: 'attached' })
                    .then(() => page.click('#verification-completed-button'))
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
                const messageDiv = document.getElementById('manual-verification-message');
                if (messageDiv) {
                    messageDiv.remove();
                }
            });
            
            // Wait a moment for any login process to complete
            await page.waitForTimeout(3000);
            
            log.info('Resuming after email verification');
            return true;
        } else {
            log.info('No email verification required');
            return true; // Return true when no verification is needed
        }
    } catch (error) {
        log.error('Error in email verification handling:', { error: (error as Error).message });
        return false;
    }
}