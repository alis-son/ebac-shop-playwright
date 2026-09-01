import { Page, Locator } from '@playwright/test';

export class CheckoutPage {
  constructor(public page: Page) {}

  // =============== SEÇÃO DE FATURAMENTO (BILLING) ===============
  
  get billingFirstName(): Locator {
    return this.page.locator('#billing_first_name').first();
  }

  get billingLastName(): Locator {
    return this.page.locator('#billing_last_name').first();
  }

  get billingEmail(): Locator {
    return this.page.locator('#billing_email').first();
  }

  get billingPhone(): Locator {
    return this.page.locator('#billing_phone').first();
  }

  get billingAddress(): Locator {
    return this.page.locator('#billing_address_1').first();
  }

  get billingNumber(): Locator {
    return this.page.locator('#billing_address_2').first();
  }

  get billingCity(): Locator {
    return this.page.locator('#billing_city').first();
  }

  get billingState(): Locator {
    return this.page.locator('#billing_state').first();
  }

  get billingPostcode(): Locator {
    return this.page.locator('#billing_postcode').first();
  }

  get billingCountry(): Locator {
    return this.page.locator('#billing_country').first();
  }

  // =============== RESUMO DO PEDIDO (ORDER REVIEW) ===============

  get orderReviewTable(): Locator {
    return this.page.locator('.woocommerce-checkout-review-order-table, table.woocommerce-checkout-review-order-table').first();
  }

  get orderProductName(): Locator {
    return this.page.locator('.woocommerce-checkout-review-order-table td.product-name').first();
  }

  get orderQuantity(): Locator {
    return this.page.locator('.woocommerce-checkout-review-order-table .product-quantity').first();
  }

  get orderSubtotal(): Locator {
    return this.page.locator('.woocommerce-checkout-review-order-table .order-subtotal .woocommerce-Price-amount').first();
  }

  get orderShipping(): Locator {
    return this.page.locator('.woocommerce-checkout-review-order-table .shipping .woocommerce-Price-amount').first();
  }

  get orderTotal(): Locator {
    return this.page.locator('.woocommerce-checkout-review-order-table .order-total .woocommerce-Price-amount').first();
  }

  get receivedOrderProductName(): Locator {
    return this.page.locator('.woocommerce-order-details td.product-name').first();
  }

  get receivedOrderProductTotal(): Locator {
    return this.page.locator('.woocommerce-order-details .product-total .woocommerce-Price-amount').first();
  }

  get receivedOrderTotal(): Locator {
    return this.page.locator('.woocommerce-order-details tfoot .woocommerce-Price-amount').last();
  }

  // =============== MENSAGENS DE ERRO ===============

  get errorMessages(): Locator {
    return this.page.locator('.woocommerce-error, .woocommerce-message, .error');
  }

  get requiredFieldErrors(): Locator {
    return this.page.locator('.woocommerce-error');
  }

  // =============== BOTÕES DE AÇÃO ===============

  get placeOrderButton(): Locator {
    return this.page.locator('#place_order:visible, [name="place_order"]:visible').first();
  }

  get termsCheckbox(): Locator {
    return this.page.locator('#terms, input[name="terms"]').first();
  }

  // =============== MÉTODOS DE NAVEGAÇÃO ===============

  async goto() {
    await this.page.goto('http://lojaebac.ebaconline.art.br/checkout/');
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(1000);
  }

  // =============== MÉTODOS DE PREENCHIMENTO ===============

  /**
   * Preencher dados de faturamento
   */
  async fillBillingData(data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
    number?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  }) {
    if (data.firstName) {
      await this.billingFirstName.fill(data.firstName);
    }

    if (data.lastName) {
      await this.billingLastName.fill(data.lastName);
    }

    if (data.email) {
      await this.billingEmail.fill(data.email);
    }

    if (data.phone) {
      await this.billingPhone.fill(data.phone);
    }

    if (data.address) {
      await this.billingAddress.fill(data.address);
    }

    if (data.number) {
      await this.billingNumber.fill(data.number);
    }

    if (data.city) {
      await this.billingCity.fill(data.city);
    }

    if (data.state) {
      const stateElement = this.billingState;
      const tagName = await stateElement.evaluate((el) => el.tagName.toLowerCase());

      if (tagName === 'select') {
        await stateElement.selectOption(data.state);
      } else {
        await stateElement.fill(data.state);
      }
    }

    if (data.postcode) {
      await this.billingPostcode.fill(data.postcode);
    }

    if (data.country) {
      const countryElement = this.billingCountry;
      const tagName = await countryElement.evaluate((el) => el.tagName.toLowerCase());

      if (tagName === 'select') {
        await countryElement.selectOption(data.country);
      } else {
        await countryElement.fill(data.country);
      }
    }

    await this.page.waitForLoadState('networkidle');
  }

  // =============== MÉTODOS DE VALIDAÇÃO ===============

  /**
   * Validar que a URL é de checkout
   */
  async isCheckoutPage(): Promise<boolean> {
    const url = this.page.url();
    // Verificar múltiplas variações de URL de checkout
    return url.includes('/checkout') || url.includes('checkout') || url.includes('/pagar');
  }

  async isOrderReceivedPage(): Promise<boolean> {
    return this.page.url().includes('order-received');
  }

  /**
   * Validar que o resumo do pedido está visível
   */
  async isOrderReviewVisible(): Promise<boolean> {
    return (await this.orderReviewTable.count()) > 0;
  }

  /**
   * Capturar dados do resumo do pedido
   */
  async getOrderReviewData(): Promise<{
    productName: string;
    quantity: string;
    total: string;
  }> {
    const productName = await this.orderProductName.innerText();
    const quantity = await this.orderQuantity.innerText();
    const total = await this.orderTotal.innerText();

    return {
      productName: productName.trim(),
      quantity: quantity.trim(),
      total: total.trim(),
    };
  }

  async getReceivedOrderData(): Promise<{
    productName: string;
    productTotal: string;
    orderTotal: string;
  }> {
    const productName = await this.receivedOrderProductName.innerText();
    const productTotal = await this.receivedOrderProductTotal.innerText();
    const orderTotal = await this.receivedOrderTotal.innerText();

    return {
      productName: productName.trim(),
      productTotal: productTotal.trim(),
      orderTotal: orderTotal.trim(),
    };
  }

  /**
   * Validar que há mensagens de erro de campos obrigatórios
   */
  async hasRequiredFieldErrors(): Promise<boolean> {
    return (await this.requiredFieldErrors.count()) > 0;
  }

  /**
   * Obter textos de erro
   */
  async getErrorMessages(): Promise<string[]> {
    const errors = await this.errorMessages.allTextContents();
    return errors.map((e) => e.trim()).filter((e) => e.length > 0);
  }

  async acceptTerms() {
    if ((await this.termsCheckbox.count()) === 0) {
      throw new Error('Checkbox de aceite dos termos não encontrado no checkout');
    }

    if (!(await this.termsCheckbox.isChecked())) {
      try {
        await this.termsCheckbox.check({ force: true });
      } catch {
        await this.termsCheckbox.evaluate((element) => {
          const checkbox = element as HTMLInputElement;
          checkbox.checked = true;
          checkbox.dispatchEvent(new Event('input', { bubbles: true }));
          checkbox.dispatchEvent(new Event('change', { bubbles: true }));
        });
      }
    }

    if (!(await this.termsCheckbox.isChecked())) {
      await this.page.locator('label[for="terms"]').click({ force: true });
    }

    await this.page.waitForFunction(
      () => (document.querySelector('#terms, input[name="terms"]') as HTMLInputElement | null)?.checked === true,
      { timeout: 5000 }
    );

    if (!(await this.termsCheckbox.isChecked())) {
      throw new Error('Não foi possível marcar o aceite dos termos');
    }
  }

  // =============== MÉTODOS DE AÇÃO ===============

  /**
   * Finalizar a compra clicando em "Place Order"
   */
  async placeOrder() {
    const placeOrderBtn = this.placeOrderButton;

    if ((await placeOrderBtn.count()) === 0) {
      throw new Error('Botão "Place Order" não encontrado no checkout');
    }

    await this.acceptTerms();

    await placeOrderBtn.evaluate((btn) => {
      (btn as HTMLElement).scrollIntoView({ behavior: 'smooth' });
    });

    await this.page.waitForTimeout(500);

    await Promise.all([
      this.page.waitForURL(/order-received/, { timeout: 15000 }),
      placeOrderBtn.click(),
    ]);
  }

  /**
   * Tentar finalizar a compra (pode falhar se houver erros de validação)
   * Retorna true se bem-sucedido, false se houver erros
   */
  async attemptPlaceOrder(): Promise<boolean> {
    try {
      const placeOrderBtn = this.placeOrderButton;

      if ((await placeOrderBtn.count()) === 0) {
        console.log('⚠️  Botão "Place Order" não encontrado');
        return false;
      }

      await this.acceptTerms();

      await placeOrderBtn.evaluate((btn) => {
        (btn as HTMLElement).scrollIntoView({ behavior: 'smooth' });
      });

      await this.page.waitForTimeout(500);

      const checkoutResponse = this.page.waitForResponse(
        (response) => response.url().includes('wc-ajax=checkout') && response.request().method() === 'POST',
        { timeout: 10000 }
      ).catch(() => undefined);

      await placeOrderBtn.click({ force: true });

      await checkoutResponse;

      await Promise.race([
        this.page.waitForFunction(
          () => Array.from(document.querySelectorAll('.woocommerce-error'))
            .some((element) => (element.textContent ?? '').trim().length > 0),
          { timeout: 5000 }
        ),
        this.page.waitForURL(/order-received/, { timeout: 5000 }),
      ]).catch(() => undefined);

      const errors = await this.getErrorMessages();

      if (errors.length > 0) {
        console.log('❌ Erros encontrados:');
        errors.forEach((e) => console.log(`   - ${e}`));
        return false;
      }

      return this.page.url().includes('order-received');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Erro ao tentar finalizar compra:', message);
      return false;
    }
  }
}
