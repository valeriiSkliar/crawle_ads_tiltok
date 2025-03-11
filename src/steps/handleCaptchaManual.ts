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
        await page.waitForTimeout(8000); // Check every 8000ms
        
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
            try {
                const visibleSelector = await page.waitForSelector(selector, { timeout: 1000 });
                const isVisible = await visibleSelector?.isVisible();
                if (isVisible) {
                    captchaDetected = true;
                    log.info(`CAPTCHA detected with selector: ${selector}`);
                    break;
                }
            } catch (err: unknown) {
                if (err instanceof Error) {
                    log.error('Error checking for CAPTCHA:', { error: err.message });  
                }
                // Continue checking other selectors
            }
        }
        
        // Always pause the process - take a screenshot showing current state
        await page.screenshot({ path: 'storage/screenshots/process-paused.png' });
        
        if (captchaDetected) {
            log.warning('CAPTCHA detected! Process paused for manual intervention...');
        } else {
            log.info('Process paused for manual checking/intervention...');
        }
        
        // Create a simple notification overlay with plain HTML
        await page.evaluate(() => {
            // First clean up any existing notifications
            const existing = document.getElementById('captcha-notification');
            if (existing) existing.remove();
            
            // Create the container
            const container = document.createElement('div');
            container.id = 'captcha-notification';
            container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:99999;display:flex;justify-content:center;align-items:center;';
            
            // Create the box
            const box = document.createElement('div');
            box.style.cssText = 'background:white;padding:30px;border-radius:10px;text-align:center;max-width:400px;';
            
            // Create header
            const header = document.createElement('h2');
            header.textContent = document.querySelector('div[class*="captcha"]') ? 'CAPTCHA DETECTED!' : 'PROCESS PAUSED';
            header.style.cssText = 'color:#ff3030;margin-bottom:20px;';
            
            // Create description
            const description = document.createElement('p');
            description.textContent = 'Please complete the CAPTCHA or any verification steps required. The process is paused until you click "Continue" below.';
            description.style.cssText = 'margin-bottom:30px;';
            
            // Create button
            const button = document.createElement('button');
            button.id = 'continue-button';
            button.textContent = 'Continue Process';
            button.style.cssText = 'background:#4CAF50;color:white;padding:10px 20px;border:none;border-radius:5px;cursor:pointer;font-size:16px;font-weight:bold;';
            
            // Add hover effect to button
            button.onmouseover = () => button.style.background = '#45a049';
            button.onmouseout = () => button.style.background = '#4CAF50';
            
            // Add all elements to the DOM
            box.appendChild(header);
            box.appendChild(description);
            box.appendChild(button);
            container.appendChild(box);
            document.body.appendChild(container);
            
            // Make sure the container is absolutely the top element
            document.body.style.overflow = 'hidden'; // Prevent scrolling
        });
        
        log.info('Waiting for user to click continue...');
        
        // An extremely simple approach using polling: check every 500ms if the button was clicked
        // This avoids the complex Promise evaluation in the browser context that was causing issues
        let buttonClicked = false;
        
        // Setup the click event with exposeFunction to avoid complex browser context evaluation
        await page.exposeFunction('notifyContinue', () => {
            buttonClicked = true;
        });
        
        // Add the click listener to the button
        await page.evaluate(() => {
            const button = document.getElementById('continue-button');
            if (button) {
                button.addEventListener('click', () => {
                    window.notifyContinue();
                });
            }
        });
        
        // Poll until the button is clicked
        const startTime = Date.now();
        const maxWaitTime = 3600000; // 1 hour in milliseconds
        
        while (!buttonClicked && (Date.now() - startTime < maxWaitTime)) {
            await page.waitForTimeout(500); // Check every 500ms
            
            // Keep the notification visible
            await page.evaluate(() => {
                const notificationElement = document.getElementById('captcha-notification');
                if (!notificationElement || !document.body.contains(notificationElement)) {
                    // The notification is missing, add it back
                    const existing = document.querySelectorAll('#captcha-notification');
                    existing.forEach(el => el.remove());
                    
                    // Re-create the container (simplified)
                    const container = document.createElement('div');
                    container.id = 'captcha-notification';
                    container.innerHTML = `
                        <div style="background:white;padding:30px;border-radius:10px;text-align:center;max-width:400px;">
                            <h2 style="color:#ff3030;margin-bottom:20px;">PROCESS PAUSED</h2>
                            <p style="margin-bottom:30px;">Please complete the CAPTCHA or any verification steps required. The process is paused until you click "Continue" below.</p>
                            <button id="continue-button" style="background:#4CAF50;color:white;padding:10px 20px;border:none;border-radius:5px;cursor:pointer;font-size:16px;font-weight:bold;">Continue Process</button>
                        </div>
                    `;
                    container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:99999;display:flex;justify-content:center;align-items:center;';
                    document.body.appendChild(container);
                    
                    // Re-attach the event listener
                    const button = document.getElementById('continue-button');
                    if (button) {
                        button.addEventListener('click', () => {
                            window.notifyContinue();
                        });
                    }
                }
                
                // Ensure highest z-index
                const overlay = document.getElementById('captcha-notification');
                if (overlay) {
                    overlay.style.zIndex = '99999';
                }
            });
        }
        
        if (!buttonClicked) {
            throw new Error('Timed out waiting for user to click continue button.');
        }
        
        // The button was clicked, show a success message
        await page.evaluate(() => {
            const notification = document.getElementById('captcha-notification');
            if (notification) {
                notification.innerHTML = `
                    <div style="background:white;padding:30px;border-radius:10px;text-align:center;max-width:400px;">
                        <h2 style="color:#4CAF50;margin-bottom:20px;">CONTINUING PROCESS</h2>
                        <p>Thank you! The process will now continue...</p>
                    </div>
                `;
            }
            
            // Re-enable scrolling
            document.body.style.overflow = '';
        });
        
        // Allow user to see the "continuing" message briefly
        await page.waitForTimeout(2000);
        
        // Remove the notification
        await page.evaluate(() => {
            const notification = document.getElementById('captcha-notification');
            if (notification) {
                notification.remove();
            }
        });
        
        log.info('Resuming process after manual intervention');
        return true;
    } catch (error) {
        // Critical error handling
        log.error('CRITICAL ERROR in CAPTCHA handling:', { error: (error as Error).message });
        
        // Take a screenshot in case of error
        await page.screenshot({ path: 'storage/screenshots/captcha-error.png' });
        
        // Add a visible error message on the page
        await page.evaluate(() => {
            const errorDiv = document.createElement('div');
            errorDiv.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:99999;display:flex;justify-content:center;align-items:center;';
            errorDiv.innerHTML = `
                <div style="background:white;padding:30px;border-radius:10px;text-align:center;max-width:400px;">
                    <h2 style="color:#ff3030;margin-bottom:20px;">ERROR</h2>
                    <p>A critical error occurred. Please restart the application.</p>
                </div>
            `;
            document.body.appendChild(errorDiv);
        });
        
        // Important: Re-throw the error to make the calling function abort
        throw new Error(`CAPTCHA handling failed: ${(error as Error).message}. Process aborted.`);
    }
}