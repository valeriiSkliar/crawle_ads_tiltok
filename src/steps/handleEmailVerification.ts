import { Page } from 'playwright';
import { Log } from 'crawlee';
import { EmailApiService } from '../utils/emailApiService.js';

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
        
        // Primary selector for the email verification form
        const mainFormSelector = '#TikTok_Ads_SSO_Login_Code_Content';

        // Wait for the main verification form to be present
        await page.waitForSelector(mainFormSelector, { timeout: 5000 }).catch(() => {});
        
        // Check if the main verification form is present
        const isVerificationFormVisible = await page.isVisible(mainFormSelector).catch(() => false);
        
        if (!isVerificationFormVisible) {
            log.info('No email verification required');
            return false;
        }
        
        // Verification form is detected
        log.info('Email verification form detected');
        await page.screenshot({ path: 'storage/screenshots/email-verification-detected.png' });
        
        // Get the email address to which the code was sent
        let emailAddress = '';
        try {
            const emailElement = await page.$('#TikTok_Ads_SSO_Login_Code_Email');
            if (emailElement) {
                emailAddress = await emailElement.textContent() || '';
                log.info(`Verification code sent to: ${emailAddress}`);
            }
        } catch (e) {
            log.debug('Could not retrieve email address:', { error: (e as Error).message });
        }
        
        // Initialize the email API service
        const emailApiService = new EmailApiService(log);
        
        // Try to get verification code automatically first
        let verificationCode = '';
        let autoVerificationSucceeded = false;
        
        try {
            log.info('Attempting to automatically retrieve verification code from email API...');
            
            // Check if the email server is running
            const serverStatus = await emailApiService.getServerStatus().catch(() => null);
            if (!serverStatus) {
                log.warning('Email server is not running or not accessible. Will require manual verification.');
            } else {
                log.info('Email server is running. Fetching verification code...');
                
                // Get the verification code
                const codeResponse = await emailApiService.getTikTokVerificationCode();
                
                if (codeResponse.code) {
                    verificationCode = codeResponse.code;
                    log.info(`Successfully retrieved verification code: ${verificationCode}`);
                    
                    // Enter the verification code in the input field
                    try {
                        // Use the exact selector from the HTML
                        const codeInputSelector = '#TikTok_Ads_SSO_Login_Code_Input';
                        await page.waitForSelector(codeInputSelector, { timeout: 5000 });
                        await page.fill(codeInputSelector, verificationCode);
                        log.info('Entered verification code in the input field');
                        
                        // Click the login button
                        const loginButtonSelector = '#TikTok_Ads_SSO_Login_Code_Btn';
                        await page.waitForSelector(loginButtonSelector, { timeout: 5000 });
                        await page.click(loginButtonSelector);
                        log.info('Clicked the login button');
                        
                        // Wait for navigation or verification completion
                        await page.waitForTimeout(3000);
                        autoVerificationSucceeded = true;
                    } catch (e) {
                        log.error('Error entering verification code or clicking login button:', { error: (e as Error).message });
                    }
                } else {
                    log.warning('No verification code found in email API response', { response: codeResponse });
                }
            }
        } catch (error) {
            log.error('Error during automatic verification:', { error: (error as Error).message });
            // Continue to manual verification as fallback
        }
        
        // Check if we're still on the verification page
        const stillOnVerification = await page.isVisible(mainFormSelector).catch(() => false);
        
        // If automatic verification failed, fall back to manual verification
        if (!autoVerificationSucceeded || stillOnVerification) {
            log.warning(`Automatic verification ${autoVerificationSucceeded ? 'may have failed' : 'failed'}. Falling back to manual verification...`);
            
            // Display a message for the user with the verification code
            const messageScript = `
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
                
                let codeMessage = '';
                if ('${verificationCode}') {
                    codeMessage = \`<p>Retrieved verification code: <strong>${verificationCode}</strong></p>
                    <p>Please enter this code in the form if it's not already entered.</p>\`;
                } else {
                    codeMessage = \`<p>Please check ${emailAddress ? emailAddress : 'your email'} for a verification code from "TikTok For Business".</p>\`;
                }
                
                messageDiv.innerHTML = \`
                    <p>EMAIL VERIFICATION REQUIRED!</p>
                    \${codeMessage}
                    <p>Enter the code in the form and click "Log in".</p>
                    <p>Press Enter or click the button below when done.</p>
                \`;
                
                // Add a button for users who prefer clicking
                const doneButton = document.createElement('button');
                doneButton.id = 'verification-done-button';
                doneButton.textContent = 'I\\'ve entered the verification code';
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
            `;
            
            await page.evaluate(messageScript);
            
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
        }
        
        // Wait a moment for any animations to complete
        await page.waitForTimeout(2000);
        
        // Check if we're still on the verification page
        const finalVerificationCheck = await page.isVisible(mainFormSelector).catch(() => false);
        
        if (finalVerificationCheck) {
            log.warning('Email verification might not have been completed correctly.');
            return false;
        } else {
            log.info('Email verification appears to be completed successfully!');
            return true;
        }
    } catch (error) {
        log.error('Error in email verification handling:', { error: (error as Error).message });
        await page.screenshot({ path: 'storage/screenshots/email-verification-error.png' });
        return false;
    }
}
