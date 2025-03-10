import { Page } from 'playwright';
import { Log } from 'crawlee';

/**
 * Displays a notification that the process has been aborted
 * @param page Playwright page object
 * @param log Logger instance
 * @param error Error that caused the process to abort
 */
export async function showProcessAbortedNotification(
    page: Page, 
    log: Log, 
    error: Error
): Promise<void> {
    // Log the error
    log.error('Critical error during process:', { error: error.message });
    log.info('Process aborted due to error handling failure.');
    
    // Take a final screenshot of the current state
    await page.screenshot({ path: 'storage/screenshots/process-aborted.png' });
    
    // Display notification that process is aborted
    await page.evaluate(() => {
        const abortDiv = document.createElement('div');
        abortDiv.style.position = 'fixed';
        abortDiv.style.top = '10%';
        abortDiv.style.left = '10%';
        abortDiv.style.transform = 'translate(-10%, -10%)';
        abortDiv.style.padding = '30px';
        abortDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        abortDiv.style.color = 'white';
        abortDiv.style.fontWeight = 'bold';
        abortDiv.style.fontSize = '24px';
        abortDiv.style.zIndex = '999999';
        abortDiv.style.borderRadius = '10px';
        abortDiv.style.textAlign = 'center';
        abortDiv.textContent = 'PROCESS ABORTED - Please restart the application';
        document.body.appendChild(abortDiv);
    });
    
    // Wait for a moment to show the message
    await page.waitForTimeout(10000);
}
