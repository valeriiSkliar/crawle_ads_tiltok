import { PlaywrightCrawlingContext } from "crawlee";

async function handler(label: string, context: PlaywrightCrawlingContext) {
    console.info(`Processing ${label}...`);
    console.info(`Request URL: ${context.request.url}`);

  // Implement your default handler logic here
}

export const playwrightDefaultHandler = async (label: string, context: PlaywrightCrawlingContext) => {
    return await handler(label, context);
};
