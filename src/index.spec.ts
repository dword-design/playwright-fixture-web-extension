import { Base } from '@dword-design/base';
import { test } from '@playwright/test';
import packageName from 'depcheck-package-name';
import endent from 'endent';
import { execaCommand } from 'execa';
import express from 'express';
import getPort from 'get-port';
import outputFiles from 'output-files';

test('works', async ({}, testInfo) => {
  const cwd = testInfo.outputPath();
  const port = await getPort();

  await outputFiles(cwd, {
    'entrypoints/content.ts':
      "export default defineContentScript({ main: () => document.body.classList.add('foo'), matches: ['<all_urls>'] });",
    'index.spec.ts': endent`
      import { expect } from '@playwright/test';
      import { test } from '../../src';

      test('works', async ({ page }) => {
        await page.goto('http://localhost:${port}');
        await expect(page.locator('body')).toContainClass('foo');
      });
    `,
    'package.json': JSON.stringify({ name: 'foo', version: '0.0.1' }),
  });

  const base = new Base(packageName`@dword-design/base-config-web-extension`, {
    cwd,
  });

  await base.prepare();
  await base.run('build');

  const server = express()
    .get('/', (req, res) => res.send())
    .listen(port);

  try {
    await execaCommand('playwright test index.spec.ts', { cwd });
  } finally {
    server.close();
  }
});
