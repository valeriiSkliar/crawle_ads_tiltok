import { randomBetween, typeWithHumanDelay } from "@src/helpers/index.js";
import { Log } from "crawlee";
import { Page } from "playwright";

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
