import path from 'node:path';

import {
  type BrowserContext,
  chromium,
  test as base,
  type Worker,
} from '@playwright/test';

const pathToExtension = path.resolve('dist/chrome');

export const test = base.extend<{
  context: BrowserContext;
  background: Worker;
  extensionId: string;
}>({
  background: async ({ context }, use) => {
    let [background] = context.serviceWorkers();

    if (!background) {
      background = await context.waitForEvent('serviceworker');
    }

    await use(background);
  },
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
      channel: 'chromium',
    });

    await use(context);
    await context.close();
  },
  extensionId: async ({ background }, use) => {
    const extensionId = background.url().split('/')[2];
    await use(extensionId);
  },
  page: async ({ context }, use) => use(await context.newPage()),
});
