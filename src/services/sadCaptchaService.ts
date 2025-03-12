import { ENV } from '@lib/EnvLoader.js';
import axios from 'axios';
import { Log } from 'crawlee';
import { Page } from 'playwright';

interface SadCaptchaResponse {
    pointOneProportionX: number;
    pointOneProportionY: number;
    pointTwoProportionX: number;
    pointTwoProportionY: number;
}

export class SadCaptchaService {
    private readonly baseUrl = 'https://www.sadcaptcha.com/api/v1';
    private readonly log: Log;

    constructor(log: Log) {
        this.log = log;
    }

    async solveCaptcha(page: Page, captchaImageSelector: string): Promise<boolean> {
        try {
            // Get the captcha element
            const captchaElement = await page.$(captchaImageSelector);
            if (!captchaElement) {
                this.log.error('Captcha element not found');
                return false;
            }

            // Get the image as base64
            const buffer = await captchaElement.screenshot({
                type: 'png'
            });
            const imageBase64 = buffer.toString('base64');

            // Get solution from SadCaptcha API
            const solution = await this.getSolution(imageBase64);
            if (!solution) {
                return false;
            }

            // Get element dimensions
            const boundingBox = await captchaElement.boundingBox();
            if (!boundingBox) {
                this.log.error('Could not get captcha element dimensions');
                return false;
            }

            // Calculate actual click coordinates
            const clickPoints = [
                {
                    x: boundingBox.width * solution.pointOneProportionX,
                    y: boundingBox.width * solution.pointOneProportionY
                },
                {
                    x: boundingBox.width * solution.pointTwoProportionX,
                    y: boundingBox.width * solution.pointTwoProportionY
                }
            ];

            // Click the points
            for (const point of clickPoints) {
                await captchaElement.click({
                    position: {
                        x: point.x,
                        y: point.y
                    }
                });
                // Wait a bit between clicks to simulate human behavior
                await page.waitForTimeout(500);
            }

            this.log.info('Captcha solution applied');
            return true;
        } catch (error) {
            this.log.error('Error solving captcha:', { error: (error as Error).message });
            return false;
        }
    }

    private async getSolution(imageBase64: string): Promise<SadCaptchaResponse | null> {
        try {
            const response = await axios.post(
                `${this.baseUrl}/shapes`,
                { imageB64: imageBase64 },
                {
                    params: {
                        licenseKey: ENV.SAD_CAPTCHA_API_KEY
                    }
                }
            );

            return response.data;
        } catch (error) {
            this.log.error('Error getting captcha solution:', { error: (error as Error).message });
            return null;
        }
    }
}
