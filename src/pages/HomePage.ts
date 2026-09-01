import { Locator, Page } from '@playwright/test';

export class HomePage {
  constructor(public page: Page) {}

  async goto() {
    await this.page.goto('/');
    await this.page.waitForTimeout(2000); // Aguardar renderização JS
  }

  async openProduct(productId: string) {
    await this.page.click(`a[href*="${productId}"]`);
  }

  private get firstProductCard(): Locator {
    return this.page.locator('.product:visible').first();
  }

  private get firstProductLink(): Locator {
    return this.firstProductCard.locator('a[href*="/product/"]').first();
  }

  private get firstMultiQuantityProductLink(): Locator {
    return this.page
      .locator('.product:not(.sold-individually):visible')
      .first()
      .locator('a.product-image')
      .first();
  }

  async getFirstProductName(): Promise<string | null> {
    await this.firstProductLink.waitFor({ state: 'visible' });
    return await this.firstProductLink.getAttribute('title');
  }

  async clickFirstProduct(): Promise<void> {
    await this.firstProductLink.waitFor({ state: 'visible' });
    await Promise.all([
      this.page.waitForURL(/\/product\//),
      this.firstProductLink.click(),
    ]);
  }

  async clickFirstMultiQuantityProduct(): Promise<void> {
    await this.firstMultiQuantityProductLink.waitFor({ state: 'visible' });
    const productUrl = await this.firstMultiQuantityProductLink.getAttribute('href');

    if (!productUrl) {
      throw new Error('Link do produto com quantidade permitida não encontrado');
    }

    await this.page.goto(productUrl);
    await this.page.waitForLoadState('domcontentloaded');
  }
}
