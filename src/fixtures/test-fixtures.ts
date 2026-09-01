import { test as base, BrowserContext, Page, expect } from '@playwright/test';

export const test = base.extend<{
  context: BrowserContext;
  page: Page;
}>({});

export { expect };
