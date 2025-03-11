import { Page } from 'playwright';
import { Log } from 'crawlee';
import { EmailApiService } from '../utils/emailApiService.js';

/**
 * Check for email verification code form and wait for user to enter the code
 * @param page - Playwright page object
 * @param log - Crawlee logger
 * @returns Promise<boolean> - true if verification was successful, false otherwise
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
            const visibleSelector = await page.waitForSelector(selector, { timeout: 3000 }).catch(() => null);
            
            if (visibleSelector) {
                const isVisible = await visibleSelector.isVisible().catch(() => false);
                if (isVisible) {
                    verificationDetected = true;
                    log.info(`Email verification detected with selector: ${selector}`);
                    break;
                }
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
            
            log.warning(`Email verification required${emailAddress ? ' for ' + emailAddress : ''}!`);
            
            // Initialize the email API service
            const emailApiService = new EmailApiService(log);
            
            // Define the callback function to enter the verification code
            const enterVerificationCode = async (code: string): Promise<boolean> => {
                try {
                    // Take a screenshot before attempting to find elements
                    await page.screenshot({ path: 'storage/screenshots/before-code-entry.png' });
                    
                    // Log the page content for debugging
                    const pageContent = await page.content();
                    log.debug('Page content before code entry:', { 
                        contentLength: pageContent.length,
                        snippet: pageContent.substring(0, 500) + '...' 
                    });
                    
                    // Find the input field for the verification code
                    const codeInputSelector = 'input[name="code"], input[placeholder="Verification code"], input[placeholder="Enter verification code"], input.verification-code-input, #TikTok_Ads_SSO_Code_Code_Input, #TikTok_Ads_SSO_Login_Code_Input';
                    
                    log.info(`Waiting for verification code input field with selector: ${codeInputSelector}`);
                    
                    // Instead of trying to interact with the input directly, use page.evaluate
                    // to set the value and trigger the necessary events
                    const inputExists = await page.evaluate(({ selector, codeValue }) => {
                        const inputs = Array.from(document.querySelectorAll(selector));
                        
                        // Try to find visible inputs first
                        let input = inputs.find(el => {
                            const rect = el.getBoundingClientRect();
                            return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).display !== 'none';
                        }) as HTMLInputElement;
                        
                        // If no visible input, try any input
                        if (!input && inputs.length > 0) {
                            input = inputs[0] as HTMLInputElement;
                        }
                        
                        if (input) {
                            // Set the value directly
                            input.value = codeValue;
                            
                            // Dispatch events to simulate user interaction
                            input.dispatchEvent(new Event('input', { bubbles: true }));
                            input.dispatchEvent(new Event('change', { bubbles: true }));
                            
                            return true;
                        }
                        
                        return false;
                    }, { selector: codeInputSelector, codeValue: code });
                    
                    if (!inputExists) {
                        // Try frames if main frame didn't work
                        log.info('Input not found in main frame, trying frames...');
                        
                        const frames = page.frames();
                        let frameSuccess = false;
                        
                        for (const frame of frames) {
                            try {
                                const success = await frame.evaluate(({ selector, codeValue }) => {
                                    const inputs = Array.from(document.querySelectorAll(selector));
                                    
                                    let input = inputs.find(el => {
                                        const rect = el.getBoundingClientRect();
                                        return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).display !== 'none';
                                    }) as HTMLInputElement;
                                    
                                    if (!input && inputs.length > 0) {
                                        input = inputs[0] as HTMLInputElement;
                                    }
                                    
                                    if (input) {
                                        input.value = codeValue;
                                        input.dispatchEvent(new Event('input', { bubbles: true }));
                                        input.dispatchEvent(new Event('change', { bubbles: true }));
                                        return true;
                                    }
                                    
                                    return false;
                                }, { selector: codeInputSelector, codeValue: code });
                                
                                if (success) {
                                    frameSuccess = true;
                                    log.info(`Entered code in frame: ${await frame.name() || 'unnamed'}`);
                                    break;
                                }
                            } catch (e) {
                                log.debug(`Error in frame ${await frame.name() || 'unnamed'}:`, { error: (e as Error).message });
                            }
                        }
                        
                        if (!frameSuccess) {
                            log.error('Could not find or interact with verification code input in any frame');
                            return false;
                        }
                    } else {
                        log.info('Successfully entered verification code in main frame');
                    }
                    
                    await page.screenshot({ path: 'storage/screenshots/after-code-entry.png' });
                    
                    // Try to find and click the submit button using page.evaluate
                    const submitButtonSelector = 'button[type="submit"], button:has-text("Submit"), button:has-text("Verify"), button.tiktokads-common-login-code-form-submit, .tiktokads-common-login-code-form-submit';
                    
                    const submitClicked = await page.evaluate(({ selector }) => {
                        const buttons = Array.from(document.querySelectorAll(selector));
                        
                        // Try to find visible buttons first
                        let button = buttons.find(el => {
                            const rect = el.getBoundingClientRect();
                            return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).display !== 'none';
                        }) as HTMLButtonElement;
                        
                        // If no visible button, try any button
                        if (!button && buttons.length > 0) {
                            button = buttons[0] as HTMLButtonElement;
                        }
                        
                        if (button) {
                            button.click();
                            return true;
                        }
                        
                        return false;
                    }, { selector: submitButtonSelector });
                    
                    if (!submitClicked) {
                        // Try frames if main frame didn't work
                        log.info('Submit button not found in main frame, trying frames...');
                        
                        const frames = page.frames();
                        let frameSuccess = false;
                        
                        for (const frame of frames) {
                            try {
                                const success = await frame.evaluate(({ selector }) => {
                                    const buttons = Array.from(document.querySelectorAll(selector));
                                    
                                    let button = buttons.find(el => {
                                        const rect = el.getBoundingClientRect();
                                        return rect.width > 0 && rect.height > 0 && window.getComputedStyle(el).display !== 'none';
                                    }) as HTMLButtonElement;
                                    
                                    if (!button && buttons.length > 0) {
                                        button = buttons[0] as HTMLButtonElement;
                                    }
                                    
                                    if (button) {
                                        button.click();
                                        return true;
                                    }
                                    
                                    return false;
                                }, { selector: submitButtonSelector });
                                
                                if (success) {
                                    frameSuccess = true;
                                    log.info(`Clicked submit in frame: ${await frame.name() || 'unnamed'}`);
                                    break;
                                }
                            } catch (e) {
                                log.debug(`Error clicking submit in frame ${await frame.name() || 'unnamed'}:`, { error: (e as Error).message });
                            }
                        }
                        
                        if (!frameSuccess) {
                            // As a fallback, try using keyboard Enter
                            log.info('Could not find submit button, trying Enter key');
                            await page.keyboard.press('Enter');
                        }
                    } else {
                        log.info('Successfully clicked submit button in main frame');
                    }
                    
                    await page.screenshot({ path: 'storage/screenshots/after-submit.png' });
                    
                    // Wait for navigation or success indicator
                    await Promise.race([
                        page.waitForNavigation({ timeout: 20000 }).catch(() => {
                            log.info('No navigation detected after submit');
                        }),
                        page.waitForSelector('div:has-text("Verification successful")', { timeout: 20000 }).catch(() => {
                            log.info('No success message detected');
                        })
                    ]);
                    
                    // Wait for the form to be processed
                    await page.waitForTimeout(5000);
                    
                    // Check if still on verification page
                    const stillOnVerificationPage = await page.evaluate(({ selector }) => {
                        return !!document.querySelector(selector);
                    }, { selector: codeInputSelector });
                    
                    if (stillOnVerificationPage) {
                        // Check for error messages
                        const errorMessages = await page.evaluate(() => {
                            const errorElements = document.querySelectorAll('.form-error-msg, .error-msg, [id*="Error"]');
                            return Array.from(errorElements).map(el => el.textContent?.trim()).filter(Boolean);
                        });
                        
                        if (errorMessages.length > 0) {
                            log.error('Verification error messages:', { messages: errorMessages });
                            return false;
                        }
                        
                        log.warning('Still on verification page but no error message found');
                        return false;
                    }
                    
                    log.info('Successfully navigated away from verification page');
                    return true;
                } catch (error) {
                    log.error('Error entering verification code:', { error: (error as Error).message });
                    return false;
                }
            };
            
            // Use the complete verification workflow
            const verificationResult = await emailApiService.completeVerificationCodeWorkflow(
                enterVerificationCode,
                5,  // Max attempts
                5000 // Polling interval in ms
            );
            
            log.info('Verification workflow completed:', { result: verificationResult });
            
            // If automatic verification failed, fall back to manual verification
            if (!verificationResult.success) {
                log.warning('Automatic verification failed. Waiting for manual verification...');
                
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
                
                // Wait a moment for any login process to complete
                await page.waitForTimeout(3000);
            }
            
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