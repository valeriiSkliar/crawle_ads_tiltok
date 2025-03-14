import { createPlaywrightRouter, Log } from 'crawlee';
import * as fs from 'fs/promises';
import { Page } from 'playwright';

// Add global type declaration for our custom notification function
declare global {
    interface Window {
        notifyContinue: () => void;
    }
}

import { clickLoginButton, handleCaptchaSolverApi, handleCookieConsent, handleEmailCodeVerification, fillLoginForm, scrollAndCollectData, selectPhoneEmailLogin, submitLoginForm } from './steps/index.js';
import { config } from './config.js';
import { checkApiResponsesFolderExistence, isLoggedIn, setupRequestInterception, delay, randomBetween } from './helpers/index.js';
// import { handleFilters, FilterType } from './steps/tiktok-filters-handler.js';
import { showProcessAbortedNotification } from './notifications/processAborted.js';
import { PaginationService } from './services/paginationService.js';
import { TikTokApiResponse } from './types/api.js';

export const router = createPlaywrightRouter();
// const filterConfig = {
//     [FilterType.REGION]: config.filters?.region || null,
//     [FilterType.INDUSTRY]: config.filters?.industry || null,
//     [FilterType.OBJECTIVE]: config.filters?.objective || null,
//     [FilterType.PERIOD]: config.filters?.period || null,
//     [FilterType.AD_LANGUAGE]: config.filters?.adLanguage || null,
//     [FilterType.AD_FORMAT]: config.filters?.adFormat || null,
//     [FilterType.LIKES]: config.filters?.likes || null
// };

/**
 * Attempts to restore a previously saved session state
 * @param page - Playwright Page instance
 * @param sessionPath - Path to the session state file
 * @param log - Crawlee logger instance
 * @returns Promise<boolean> - True if session was restored successfully
 */
async function restoreSession(page: Page, sessionPath: string, log: Log): Promise<boolean> {
    try {
        await fs.access(sessionPath);
        log.info('Found saved session state, attempting to restore...');
        
        // Clear existing storage before restoring
        await page.context().clearCookies();
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
            document.cookie.split(";").forEach((c) => {
                document.cookie = c
                    .replace(/^ +/, "")
                    .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
            });
        });
        
        // Restore the stored state
        const sessionState = JSON.parse(await fs.readFile(sessionPath, 'utf-8'));
        
        try {
            // Add cookies first
            await page.context().addCookies(sessionState.cookies);
            
            // First navigate to a simple page to initialize context
            try {
                await page.goto('about:blank', { timeout: 5000 });
            } catch (error: unknown) {
                const initError = error as Error;
                log.debug('Initial navigation to blank page failed:', { error: initError.message });
            }
            
            // Restore localStorage for each origin with retry logic
            if (sessionState.origins) {
                for (const { origin, localStorage } of sessionState.origins) {
                    let retryCount = 0;
                    const maxRetries = 3;
                    
                    while (retryCount < maxRetries) {
                        try {
                            // Navigate to each origin to set its localStorage
                            await page.goto(origin, { 
                                waitUntil: 'domcontentloaded', // Less strict wait condition
                                timeout: 15000 
                            });
                            
                            // Set localStorage items
                            await page.evaluate((storageItems) => {
                                for (const [key, value] of Object.entries(storageItems)) {
                                    try {
                                        window.localStorage.setItem(key, value as string);
                                    } catch (e) {
                                        console.warn(`Failed to set localStorage item: ${key}`, e);
                                    }
                                }
                            }, localStorage);
                            
                            break; // Success, exit retry loop
                        } catch (error: unknown) {
                            const navError = error as Error;
                            retryCount++;
                            if (retryCount === maxRetries) {
                                log.warning(`Failed to restore localStorage for origin ${origin} after ${maxRetries} attempts`, 
                                    { error: navError.message });
                            } else {
                                await delay(randomBetween(2000, 3000));
                            }
                        }
                    }
                }
            }
            
            // Verify cookie state
            const currentState = await page.context().storageState();
            if (!currentState.cookies || currentState.cookies.length === 0) {
                throw new Error('State restoration verification failed: No cookies present');
            }

            // Navigate to the main page with retry logic
            let loginSuccess = false;
            for (let i = 0; i < 3; i++) {
                try {
                    // Try navigation with increasing timeouts
                    await page.goto('https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en', {
                        waitUntil: 'domcontentloaded',
                        timeout: 20000 + (i * 5000)
                    });
                    
                    // Wait for network to be relatively idle
                    await page.waitForLoadState('networkidle', { timeout: 10000 })
                        .catch(() => log.debug('NetworkIdle wait timed out, continuing...'));
                    
                    await delay(randomBetween(2000, 3000));
                    
                    // Verify login status
                    loginSuccess = await isLoggedIn(page, log);
                    if (loginSuccess) break;
                    
                    // If not logged in, wait and retry
                    await delay(randomBetween(3000, 5000));
                } catch (error) {
                    log.warning(`Navigation attempt ${i + 1} failed:`, { error: (error as Error).message });
                    if (i === 2) throw error;
                    await delay(randomBetween(3000, 5000));
                }
            }
            
            if (!loginSuccess) {
                log.warning('Session restored but login check failed');
                return false;
            }
            
            // Save the verified state back
            await page.context().storageState({ path: sessionPath });
            
            log.info('Session state restored and verified successfully');
            return true;
            
        } catch (error) {
            log.error('Failed to restore session state:', { error: (error as Error).message });
            // Clear everything on failure
            await page.context().clearCookies();
            await page.evaluate(() => {
                localStorage.clear();
                sessionStorage.clear();
            });
            throw error;
        }
    } catch (err: unknown) {
        log.error('Error restoring session state:', { error: (err as Error).message });
        log.info('No saved session found or error restoring session, proceeding with normal login');
        return false;
    }
}

router.addDefaultHandler(async ({ log, page }) => {
    try {
        // Check if we have a saved session state
        const sessionPath = 'storage/state.json';
        
        // Attempt to restore session and check login status
        if (await restoreSession(page, sessionPath, log)) {
            log.info('Successfully restored previous session!');
        } else {
            log.info('Session restoration failed or expired, proceeding with new login');
            // Standard login process if not logged in
            try {
                await page.waitForSelector('div.tiktok-cookie-banner', { timeout: 5000 });
                await handleCookieConsent(page, log);
                await clickLoginButton(page, log);
                await selectPhoneEmailLogin(page, log);

                const { email, password } = config.credentials;
                await fillLoginForm(page, log, email, password);
                const loginSubmitted = await submitLoginForm(page, log);

                if (loginSubmitted) {
                    try {
                        await handleCaptchaSolverApi(page, log);
                        await handleEmailCodeVerification(page, log);
                        log.info('Successfully logged in to TikTok!');
                        
                        // Wait for the session to be fully established
                        await delay(randomBetween(5000, 8000));
                        
                        // Save the new session state after successful login
                        await page.context().storageState({ path: sessionPath });
                        log.info('New session state saved successfully');
                        
                        // Additional verification after saving session
                        const verifyLogin = await isLoggedIn(page, log);
                        if (!verifyLogin) {
                            log.error('Login verification failed after session save');
                            return;
                        }
                    } catch (captchaError) {
                        await showProcessAbortedNotification(page, log, captchaError as Error);
                        return;
                    }
                } else {
                    log.error('Failed to log in to TikTok. Please check your credentials and try again.');
                    return;
                }
            } catch (error) {
                log.warning('Error during login process:', { error: (error as Error).message });
                const stillLoggedIn = await isLoggedIn(page, log);
                if (!stillLoggedIn) {
                    log.error('Failed to log in and not currently logged in. Aborting.');
                    return;
                }
                log.info('Already logged in despite login process error. Continuing...');
            }
        }

        // Continue with data collection
        const paginationService = new PaginationService(log);
        await delay(randomBetween(1000, 3000));
        await setupRequestInterception(page, {
            onResponse: (response: TikTokApiResponse) => {
                if (response?.data?.pagination) {
                    paginationService.updatePagination(response.data.pagination);
                }
            },
            log
        });
        checkApiResponsesFolderExistence();

        await scrollAndCollectData(page, paginationService, log);
        log.info('Data collection process completed.');
    } catch (error) {
        log.error('Error during data collection:', { error: (error as Error).message });
        await page.screenshot({ path: 'storage/screenshots/error-state.png' });
    }
});
