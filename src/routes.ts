import { createPlaywrightRouter } from 'crawlee';
import {
    handleCookieConsent,
    clickLoginButton,
    selectPhoneEmailLogin,
    fillLoginForm,
    submitLoginForm,
    delay
} from './steps.js';
import { handleCaptcha, handleEmailCodeVerification, scrollAndCollectData } from './steps/index.js';
import { config } from './config.js';
import { checkApiResponsesFolderExistence, isLoggedIn, setupRequestInterception } from './helpers/index.js';
import { handleFilters, FilterType } from './steps/tiktok-filters-handler.js';

export const router = createPlaywrightRouter();
const filterConfig = {
    [FilterType.REGION]: config.filters?.region || null,
    [FilterType.INDUSTRY]: config.filters?.industry || null,
    [FilterType.OBJECTIVE]: config.filters?.objective || null,
    [FilterType.PERIOD]: config.filters?.period || null,
    [FilterType.AD_LANGUAGE]: config.filters?.adLanguage || null,
    [FilterType.AD_FORMAT]: config.filters?.adFormat || null,
    [FilterType.LIKES]: config.filters?.likes || null
};

router.addDefaultHandler(async ({ log, page }) => {

    // Проверяем, залогинены ли мы уже
    const loggedIn = await isLoggedIn(page);

    if (!loggedIn) {
        // Стандартный процесс входа, если не залогинены
        try {
            await page.waitForSelector('div.tiktok-cookie-banner', { timeout: 5000 });

            // Handle the cookie consent banner
            await handleCookieConsent(page, log);

            // Click on the login button
            await clickLoginButton(page, log);

            // Select phone/email login option from the modal
            await selectPhoneEmailLogin(page, log);

            // Fill in the login form with email and password from config
            const { email, password } = config.credentials;
            await fillLoginForm(page, log, email, password);

            // Submit the login form
            const loginSubmitted = await submitLoginForm(page, log);

            if (loginSubmitted) {
                // Check for CAPTCHA challenges
                await handleCaptcha(page, log);

                // Continue regardless of whether CAPTCHA was detected or not
                // The handleCaptcha function returns true if CAPTCHA was detected and handled,
                // and false if no CAPTCHA was detected (which is also a success case)

                // Check for email verification code
                await handleEmailCodeVerification(page, log);

                // Continue regardless of whether email verification was needed or not
                // The handleEmailCodeVerification function returns true if verification was successful OR not needed
                log.info('Successfully logged in to TikTok!');
            } else {
                log.error('Failed to log in to TikTok. Please check your credentials and try again.');
                return; // Прекращаем выполнение, если вход не удался
            }
        } catch (error) {
            log.warning('Error during login process:', { error: (error as Error).message });
            // Проверяем, залогинены ли мы, несмотря на ошибку
            const stillLoggedIn = await isLoggedIn(page);
            if (!stillLoggedIn) {
                log.error('Failed to log in and not currently logged in. Aborting.');
                return; // Прекращаем выполнение, если не залогинены
            }
            log.info('Already logged in despite login process error. Continuing...');
        }
    } else {
        log.info('Already logged in to TikTok!');
    }

    try {
        // Настраиваем перехват запросов к API
        await delay(20000);
        await setupRequestInterception(page);
        checkApiResponsesFolderExistence();

        // Apply filters
        const filtersApplied = await handleFilters(page, log, filterConfig);
        if (filtersApplied) {
            log.info('Filters applied successfully');
        } else {
            log.warning('Could not apply all filters');
        }

        // Используем выделенную функцию для прокрутки страницы и сбора данных
        await scrollAndCollectData(page);

        log.info('Процесс прокрутки и сбора данных завершен.');
    } catch (error) {
        log.error('Произошла ошибка во время сбора данных:', { error: (error as Error).message });
        // Делаем скриншот для отладки
        await page.screenshot({ path: 'storage/screenshots/error-state.png' });
    }
});
