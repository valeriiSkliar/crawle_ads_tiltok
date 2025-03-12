import { Page } from 'playwright';
import { Log } from 'crawlee';
import { delay, randomBetween } from '../helpers/index.js';

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
