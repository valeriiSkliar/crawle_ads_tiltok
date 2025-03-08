import { Page } from 'playwright';
import { Log } from 'crawlee';

/**
 * Handle email verification code challenge from TikTok
 * @param page - Playwright page object
 * @param log - Logger instance
 * @returns Promise<boolean> - Whether email verification was detected and handled
 */
export async function handleEmailVerification(page: Page, log: Log): Promise<boolean> {
    try {
        log.info('Checking for email verification code challenge...');
        
        // Take a screenshot to help with debugging
        await page.screenshot({ path: 'storage/screenshots/email-verification-check.png' });
        
        // Selectors for email verification form
        const emailVerificationSelectors = [
            'div.tiktokads-common-login-code-form',
            '#TikTok_Ads_SSO_Login_Code_Content',
            'input[name="code"]',
            '#TikTok_Ads_SSO_Login_Code_Input',
            'div:has-text("For security reasons, a verification code has been sent to")',
            'div:has-text("Verification code")'
        ];
        
        // Check for email verification form presence
        let verificationDetected = false;
        let emailAddress = '';
        
        for (const selector of emailVerificationSelectors) {
            const isVisible = await page.isVisible(selector).catch(() => false);
            if (isVisible) {
                verificationDetected = true;
                log.info(`Email verification detected with selector: ${selector}`);
                
                // Try to get the email address to which the code was sent
                try {
                    const emailElement = await page.$('#TikTok_Ads_SSO_Login_Code_Email');
                    if (emailElement) {
                        emailAddress = await emailElement.textContent() || '';
                        log.info(`Verification code sent to: ${emailAddress}`);
                    }
                } catch (e) {
                    log.debug('Could not retrieve email address:', { error: (e as Error).message });
                }
                
                break;
            }
        }
        
        if (verificationDetected) {
            // Take a screenshot of the verification form
            await page.screenshot({ path: 'storage/screenshots/email-verification-detected.png' });
            
            log.warning(`Email verification required! Waiting for manual intervention...`);
            
            // Display a message for the user
            await page.evaluate((email) => {
                const messageDiv = document.createElement('div');
                messageDiv.id = 'manual-verification-message';
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
                
                messageDiv.innerHTML = `
                    <p>EMAIL VERIFICATION REQUIRED!</p>
                    <p>Please check ${email ? email : 'your email'} for a verification code from "TikTok For Business".</p>
                    <p>Enter the code in the form and click "Log in".</p>
                    <p>Press Enter or click the button below when done.</p>
                `;
                
                // Add a button for users who prefer clicking
                const doneButton = document.createElement('button');
                doneButton.id = 'verification-done-button';
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
                page.waitForSelector('#verification-done-button', { state: 'attached' })
                    .then(() => page.click('#verification-done-button'))
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
            
            // Wait a moment for any animations to complete
            await page.waitForTimeout(2000);
            
            // Check if we're still on the verification page
            let stillOnVerification = false;
            for (const selector of emailVerificationSelectors) {
                const isVisible = await page.isVisible(selector).catch(() => false);
                if (isVisible) {
                    stillOnVerification = true;
                    log.warning(`Still on verification page after user intervention.`);
                    break;
                }
            }
            
            if (stillOnVerification) {
                log.warning('Email verification might not have been completed correctly.');
                return false;
            } else {
                log.info('Email verification appears to be completed successfully!');
                return true;
            }
        } else {
            log.info('No email verification required');
            return false;
        }
    } catch (error) {
        log.error('Error in email verification handling:', { error: (error as Error).message });
        await page.screenshot({ path: 'storage/screenshots/email-verification-error.png' });
        return false;
    }
}
