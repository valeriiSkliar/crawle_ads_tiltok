import { Locator, Page } from "playwright";
import { randomBetween } from "@helpers/index.js";

/**
 * Types text into an input field with random delays between keystrokes to simulate human typing
 * @param page - Playwright page object
 * @param element - The input element to type into
 * @param text - The text to type
 */
export async function typeWithHumanDelay(page: Page, element: Locator, text: string): Promise<void> {
    // Clear the field first
    await element.fill('');
    
    // Type each character with a random delay
    for (const char of text) {
        await element.press(char);
        // Random delay between keystrokes (between 50ms and 250ms)
        await page.waitForTimeout(randomBetween(50, 250));
    }
}