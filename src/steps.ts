import { Page, Locator } from 'playwright';
import { Log } from 'crawlee';

/**
 * Handles the TikTok cookie consent banner by clicking the "Allow all" button
 * @param page - Playwright page object
 * @param log - Crawlee logger
 * @returns Promise that resolves when the operation is complete
 */
export async function handleCookieConsent(page: Page, log: Log): Promise<void> {
    log.info('Handling cookie consent banner');
    try {
        // Look for the "Allow all" button within the cookie banner
        const allowAllButton = await page.locator('div.tiktok-cookie-banner button:has-text("Allow all")');
        
        // Check if the button exists and click it
        if (await allowAllButton.count() > 0) {
            log.info('Clicking "Allow all" button');
            await allowAllButton.click();
            log.info('Successfully clicked "Allow all" button');
            
            // Wait a moment for the banner to disappear
            await page.waitForTimeout(2000);
        } else {
            log.warning('Could not find "Allow all" button in the cookie banner');
        }
    } catch (error: unknown) {
        // Take a screenshot to help debug
        await page.screenshot({ path: 'storage/screenshots/cookie-consent-error.png' });
        log.error('Error handling cookie consent:', { error: error instanceof Error ? error.message : String(error) });
    }
}

/**
 * Clicks on the login button to initiate the login process
 * @param page - Playwright page object
 * @param log - Crawlee logger
 * @returns Promise that resolves when the operation is complete
 */
export async function clickLoginButton(page: Page, log: Log): Promise<void> {
    log.info('Attempting to click on login button');
    try {
        // Wait for the login button to be visible
        await page.waitForSelector('div[data-testid="cc_header_login"]', { timeout: 10000 });
        
        // Find the login button using the data-testid attribute
        const loginButton = await page.locator('div[data-testid="cc_header_login"]');
        
        // Check if the button exists and click it
        if (await loginButton.count() > 0) {
            log.info('Clicking login button');
            await loginButton.click();
            log.info('Successfully clicked login button');
            
            // Wait a moment for the login page/modal to load
            // await page.waitForTimeout(3000);
        } else {
            // Try alternative selector if the first one doesn't work
            const altLoginButton = await page.locator('div.FixedHeaderPc_loginBtn__lL73Y');
            
            if (await altLoginButton.count() > 0) {
                log.info('Clicking login button (using alternative selector)');
                await altLoginButton.click();
                log.info('Successfully clicked login button');
                
                // Wait a moment for the login page/modal to load
                await page.waitForTimeout(3000);
            } else {
                log.warning('Could not find login button');
            }
        }
    } catch (error: unknown) {
        // Take a screenshot to help debug
        await page.screenshot({ path: 'storage/screenshots/login-button-error.png' });
        log.error('Error clicking login button:', { error: error instanceof Error ? error.message : String(error) });
    }
}

/**
 * Waits for the login modal to appear and clicks on the "Log in with phone/email" button
 * @param page - Playwright page object
 * @param log - Crawlee logger
 * @returns Promise that resolves when the operation is complete
 */
export async function selectPhoneEmailLogin(page: Page, log: Log): Promise<void> {
    log.info('Waiting for login modal and selecting phone/email login option');
    try {
        // Wait for the login modal to be visible
        await page.waitForSelector('div.LoginModal_main__I3imq', { timeout: 10000 });
        log.info('Login modal is visible');
        
        // Try different selectors for the "Log in with phone/email" button
        // First try with text content
        const phoneEmailButton = await page.locator('div.Button_loginBtn__ImwTi:has-text("Log in with phone/email")');
        
        if (await phoneEmailButton.count() > 0) {
            log.info('Clicking "Log in with phone/email" button');
            await phoneEmailButton.click();
            log.info('Successfully clicked "Log in with phone/email" button');
            // await page.waitForTimeout(2000);
        } else {
            // Try alternative selector with image alt text
            const altPhoneEmailButton = await page.locator('div.Button_loginBtn__ImwTi img[alt="Phone/Email Login"]').first();
            
            if (await altPhoneEmailButton.count() > 0) {
                log.info('Clicking "Log in with phone/email" button (using image selector)');
                // Click the parent div of the image
                await altPhoneEmailButton.locator('..').click();
                log.info('Successfully clicked "Log in with phone/email" button');
                // await page.waitForTimeout(2000);
            } else {
                // Try one more selector based on the structure
                const lastLoginButton = await page.locator('div.LoginSelection_loginSelection__PL6fP div.Button_loginBtn__ImwTi').last();
                
                if (await lastLoginButton.count() > 0) {
                    log.info('Clicking last login button (assuming it\'s phone/email)');
                    await lastLoginButton.click();
                    log.info('Successfully clicked what should be the phone/email login button');
                    // await page.waitForTimeout(2000);
                } else {
                    log.warning('Could not find "Log in with phone/email" button');
                }
            }
        }
    } catch (error: unknown) {
        // Take a screenshot to help debug
        await page.screenshot({ path: 'storage/screenshots/phone-email-login-error.png' });
        log.error('Error selecting phone/email login:', { error: error instanceof Error ? error.message : String(error) });
    }
}

/**
 * Fills in the login form with email and password in a human-like manner
 * @param page - Playwright page object
 * @param log - Crawlee logger
 * @param email - Email address to use for login
 * @param password - Password to use for login
 * @returns Promise that resolves when the operation is complete
 */
export async function fillLoginForm(page: Page, log: Log, email: string, password: string): Promise<void> {
    log.info('Filling in login form with email and password');
    try {
        // Take a screenshot of the page before we start
        // await page.screenshot({ path: 'storage/screenshots/before-filling-form.png' });
        
        // Wait for the login form to be visible - try multiple possible selectors
        const formSelectors = [
            'div.tiktokads-common-login-form',
            'form[class*="login"]',
            'div[class*="login-form"]',
            'div[class*="login_form"]',
            'div.login-container'
        ];
        
        let formFound = false;
        for (const selector of formSelectors) {
            try {
                await page.waitForSelector(selector, { timeout: 1000 });
                log.info(`Login form found with selector: ${selector}`);
                formFound = true;
                break;
            } catch (error: unknown) {
                log.debug(`Could not find login form with selector ${selector}: ${error instanceof Error ? error.message : String(error)}`);
                // Continue trying other selectors
            }
        }
        
        if (!formFound) {
            // Take a screenshot to help debug
            await page.screenshot({ path: 'storage/screenshots/login-form-not-found.png' });
            log.warning('Could not find login form with predefined selectors. Continuing anyway...');
        }
        
        // Simulate human-like behavior by adding random delays between actions
        
        // Try multiple selectors for email input
        const emailSelectors = [
            '#TikTok_Ads_SSO_Login_Email_Input',
            'input[type="email"]',
            'input[name="email"]',
            'input[placeholder*="Email"]',
            'input[placeholder*="email"]',
            'input[class*="email"]'
        ];
        
        let emailInput = null;
        for (const selector of emailSelectors) {
            const input = page.locator(selector);
            if (await input.count() > 0) {
                emailInput = input.first(); // Use first() to handle multiple matches
                log.info(`Found email input with selector: ${selector}`);
                break;
            }
        }
        
        if (!emailInput) {
            // Try a more general approach - find all inputs and use the first one
            const allInputs = page.locator('input');
            const count = await allInputs.count();
            
            if (count > 0) {
                emailInput = allInputs.first();
                log.info('Using first input field as email input');
            } else {
                throw new Error('Could not find any input field for email');
            }
        }
        
        // Click on the email input field (like a human would)
        await emailInput.click();
        
        // Add a small random delay to simulate human thinking
        await page.waitForTimeout(randomBetween(100, 500));
        
        // Type the email address with human-like typing speed
        await typeWithHumanDelay(page, emailInput, email);
        
        log.info('Email entered');
        
        // Add a delay between filling email and password (like a human would)
        await page.waitForTimeout(randomBetween(100, 500));
        
        // Try the specific password selector first, then fall back to more general ones
        const passwordSelectors = [
            // Specific TikTok password input selector
            '#TikTok_Ads_SSO_Login_Pwd_Input',
            '.tiktokads-common-login-form-password',
            'input[type="password"]',
            'input[name="password"]',
            'input[placeholder*="Password"]',
            'input[placeholder*="password"]',
            'input[class*="password"]'
        ];
        
        let passwordInput = null;
        for (const selector of passwordSelectors) {
            const input = page.locator(selector);
            const count = await input.count();
            if (count > 0) {
                // If there are multiple password fields, use the first one
                log.info(`Found ${count} password inputs with selector: ${selector}, using the first one`);
                passwordInput = input.first(); // Use first() to handle multiple matches
                break;
            }
        }
        
        if (!passwordInput) {
            // If we can't find a password field, try using the second input field
            const allInputs = page.locator('input');
            const count = await allInputs.count();
            
            if (count > 1) {
                passwordInput = allInputs.nth(1);
                log.info('Using second input field as password input');
            } else {
                throw new Error('Could not find password input field');
            }
        }
        
        // Click on the password field
        await passwordInput.click();
        
        // Add a small random delay
        await page.waitForTimeout(randomBetween(100, 500));
        
        // Type the password with human-like typing speed
        await typeWithHumanDelay(page, passwordInput, password);
        
        log.info('Password entered');
        
        // Add a delay before proceeding (like a human would review their input)
        await page.waitForTimeout(randomBetween(100, 500));
        
        // Take a screenshot after filling the form
        // await page.screenshot({ path: 'storage/screenshots/after-filling-form.png' });
        
        // We'll handle the submit button click in the submitLoginForm function
        
    } catch (error: unknown) {
        // Take a screenshot to help debug
        await page.screenshot({ path: 'storage/screenshots/login-form-error.png' });
        log.error('Error filling login form:', { error: error instanceof Error ? error.message : String(error) });
        throw error;
    }
}

/**
 * Types text into an input field with random delays between keystrokes to simulate human typing
 * @param page - Playwright page object
 * @param element - The input element to type into
 * @param text - The text to type
 */
async function typeWithHumanDelay(page: Page, element: Locator, text: string): Promise<void> {
    // Clear the field first
    await element.fill('');
    
    // Type each character with a random delay
    for (const char of text) {
        await element.press(char);
        // Random delay between keystrokes (between 50ms and 250ms)
        await page.waitForTimeout(randomBetween(50, 250));
    }
}

/**
 * Generates a random delay within a specified range
 * @param min - Minimum delay in milliseconds
 * @param max - Maximum delay in milliseconds
 * @returns A random number between min and max
 */
function randomBetween(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Waits for a specified amount of time
 * @param ms - Time to wait in milliseconds
 * @returns Promise that resolves after the specified time
 */
export function delay(ms: number): Promise<boolean> {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(true);
        }, ms);
    });
}

/**
 * Submit the login form and check for successful login
 * @param page - Playwright page object
 * @param log - Logger instance
 * @returns Promise<boolean> - Whether the login was successful
 */
export async function submitLoginForm(page: Page, log: Log): Promise<boolean> {
    try {
        log.info('Submitting login form...');
        
        // Take a screenshot before submitting
        // await page.screenshot({ path: 'storage/screenshots/before-submit.png' });
        
        // Find and click the login button - try multiple selectors with TikTok-specific ones first
        const loginButtonSelectors = [
            // Exact TikTok login button selector from the HTML
            '#TikTok_Ads_SSO_Login_Btn',
            'button[name="loginBtn"]',
            'button.btn.primary',
            // Other TikTok-specific selectors
            'button.tiktokads-common-login-form-submit',
            'button[data-e2e="login-button"]',
            'button[id*="TikTok_Ads_SSO_Login"]',
            // Generic selectors
            'button[type="submit"]',
            'button:has-text("Log in")',
            'button:has-text("Login")',
            'button:has-text("Sign In")',
            'button:has-text("Continue")',
            'button[class*="login"]',
            'button[class*="submit"]'
        ];
        
        let loginButton = null;
        for (const selector of loginButtonSelectors) {
            const button = page.locator(selector);
            const count = await button.count();
            if (count > 0) {
                loginButton = button.first(); // Use first() to handle multiple matches
                log.info(`Found login button with selector: ${selector}, count: ${count}`);
                break;
            }
        }
        
        if (!loginButton) {
            // Take a screenshot to help debug
            // await page.screenshot({ path: 'storage/screenshots/login-button-not-found.png' });
            log.warning('Could not find login button with predefined selectors. Trying to find any button...');
            
            // Try to find any button
            const allButtons = page.locator('button');
            const count = await allButtons.count();
            
            if (count > 0) {
                // Use the last button as it's likely to be the submit button
                loginButton = allButtons.last();
                log.info(`Using last button as login button (found ${count} buttons)`);
            } else {
                throw new Error('Could not find any button for login submission');
            }
        }
        
        // Add a small delay before clicking to simulate human behavior
        await delay(randomBetween(500, 1500));
        
        // Click the login button
        await loginButton.click();
        log.info('Login form submitted');
        
        // Take a screenshot right after clicking
        // await page.screenshot({ path: 'storage/screenshots/after-submit-click.png' });
        
        // Wait for navigation or response
        await delay(randomBetween(3000, 5000));
        
        // Take another screenshot after waiting
        // await page.screenshot({ path: 'storage/screenshots/after-submit-wait.png' });
        
        // Check for successful login
        // We can check for elements that are only visible when logged in
        // or check for redirect to a dashboard page
        
        // Method 1: Check for user avatar which is typically visible after login
        const avatarSelectors = [
            'img[data-e2e="user-avatar"]',
            '.tiktok-avatar',
            'img[class*="avatar"]',
            'div[class*="avatar"]',
            // Additional TikTok-specific selectors for logged-in state
            '.user-info',
            '.user-profile',
            '.account-info'
        ];
        
        let isAvatarVisible = false;
        for (const selector of avatarSelectors) {
            isAvatarVisible = await page.isVisible(selector).catch(() => false);
            if (isAvatarVisible) {
                log.info(`Found avatar/user info with selector: ${selector}`);
                break;
            }
        }
        
        // Method 2: Check for login error messages
        const errorSelectors = [
            '.login-error',
            '.error-message',
            'div[class*="error"]',
            'span[class*="error"]',
            'p:has-text("incorrect")',
            'p:has-text("Invalid")',
            // TikTok-specific error selectors
            '.tiktokads-common-login-form-error',
            '[data-e2e="login-error"]'
        ];
        
        let isErrorVisible = false;
        let errorText = '';
        for (const selector of errorSelectors) {
            isErrorVisible = await page.isVisible(selector).catch(() => false);
            if (isErrorVisible) {
                errorText = await page.textContent(selector) || 'Unknown error';
                log.info(`Found error message: ${errorText}`);
                break;
            }
        }
        
        // Method 3: Check URL for successful redirect
        const currentUrl = page.url();
        const isRedirectedToHome = currentUrl.includes('/home') || 
                                  currentUrl.includes('/dashboard') || 
                                  !currentUrl.includes('/login');
        
        // Take a screenshot to help debug
        // await page.screenshot({ path: 'storage/screenshots/login-result.png' });
        
        if (isAvatarVisible || isRedirectedToHome) {
            log.info('Login successful!');
            return true;
        } else if (isErrorVisible) {
            log.error(`Login failed: ${errorText}`);
            return false;
        } else {
            log.warning('Login status unclear. Please check the screenshots.');
            return false;
        }
    } catch (error: unknown) {
        // Take a screenshot to help debug
        await page.screenshot({ path: 'storage/screenshots/login-submission-error.png' });
        log.error('Error submitting login form', { error: error instanceof Error ? error.message : String(error) });
        return false;
    }
}
