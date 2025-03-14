import { Page } from "playwright";

async function globalSetup({ page }: { page: Page }) {
    await page.context().storageState({ path: 'storage/state.json' });
}

export default globalSetup;