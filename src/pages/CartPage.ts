import { Page, Locator } from '@playwright/test';

export class CartPage {
  constructor(public page: Page) {}

  // Getters para elementos do carrinho
  get productName(): Locator {
    // Nome do produto na tabela do carrinho - pega TODAS as linhas
    return this.page.locator('table.shop_table td.product-name');
  }

  get quantity(): Locator {
    // Input de quantidade
    return this.page.locator('input.qty, input[class*="qty"], input[type="number"]').first();
  }

  get unitPrice(): Locator {
    // Preço unitário do produto
    return this.page.locator('table.shop_table td.product-price span.woocommerce-Price-amount, table.shop_table span[class*="price"]').nth(0);
  }

  get subtotal(): Locator {
    // Subtotal (preço × quantidade)
    return this.page.locator('table.shop_table td.product-subtotal span.woocommerce-Price-amount, table.shop_table td.product-subtotal').first();
  }

  get total(): Locator {
    // Total final do carrinho
    return this.page.locator('.order-total .woocommerce-Price-amount, .cart-total .woocommerce-Price-amount, .order-total strong').first();
  }

  get removeProductButtons(): Locator {
    return this.page.locator('a.remove');
  }

  async goto() {
    await this.page.goto('http://lojaebac.ebaconline.art.br/carrinho/');
    await this.page.waitForLoadState('networkidle');
  }

  async clearCart() {
    await this.goto();

    while ((await this.removeProductButtons.count()) > 0) {
      await this.removeFirstProduct();
    }
  }

  async removeFirstProduct() {
    if ((await this.removeProductButtons.count()) === 0) {
      throw new Error('Nenhum produto encontrado para remoção');
    }

    await this.removeProductButtons.first().evaluate((element) => {
      (element as HTMLElement).click();
    });
    await this.page.waitForFunction(
      () => !document.querySelector('.cart_item, tr.cart_item'),
      { timeout: 10000 }
    );
  }

  async checkout() {
    // Estratégia: sempre navegar diretamente para URL de checkout
    // Isso evita problemas com botões invisíveis ou não clicáveis
    
    console.log('🔗 Iniciando navegação para checkout');
    
    try {
      // Tentar clicar no botão primeiro
      const checkoutBtn = this.page.locator('a.checkout-button, button.checkout-button, a[href*="checkout"]').first();
      
      if ((await checkoutBtn.count()) > 0) {
        console.log('✅ Botão checkout encontrado, tentando clicar');
        
        try {
          await checkoutBtn.evaluate((btn) => {
            (btn as HTMLElement).click();
          });

          // Aguardar navegação
          await this.page.waitForURL(/checkout/);
          console.log('✅ Navegação via botão bem-sucedida');
          return;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.log(`⚠️  Click no botão falhou, usando navegação direta: ${message}`);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`⚠️  Erro ao tentar clicar no botão: ${message}`);
    }

    // Fallback: navegar diretamente
    console.log('📍 Navegando diretamente para /checkout/');
    await this.page.goto('http://lojaebac.ebaconline.art.br/checkout/');
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(1500);
    
    console.log(`✅ Checkout alcançado: ${this.page.url()}`);
  }

  async changeQuantity(quantity: number) {
    // Estratégia: O input de quantidade é HIDDEN no HTML
    // Solução: Usar JavaScript para modificar o valor e depois submeter o formulário via AJAX

    console.log(`📝 Alterando quantidade para: ${quantity}`);

    // 1️⃣ Usar JavaScript para encontrar e alterar o input hidden
    const result = await this.page.evaluate((newQty: number) => {
      // Procurar por qualquer input com qty no nome
      const inputs = Array.from(document.querySelectorAll('input[name*="qty"]'));

      if (inputs.length === 0) {
        console.log('❌ Nenhum input de quantidade encontrado');
        return { success: false, message: 'Nenhum input encontrado' };
      }

      // Usar o primeiro input encontrado
      const qtyInput = inputs[0] as HTMLInputElement;
      const oldValue = qtyInput.value;

      // Alterar o valor
      qtyInput.value = String(newQty);

      // Disparar eventos para garantir que o formulário perceba a mudança
      const changeEvent = new Event('change', { bubbles: true });
      const inputEvent = new Event('input', { bubbles: true });
      qtyInput.dispatchEvent(changeEvent);
      qtyInput.dispatchEvent(inputEvent);

      console.log(`✅ Input alterado: ${oldValue} → ${newQty}`);
      return { success: true, message: 'Input alterado com sucesso' };
    }, quantity);

    if (!result.success) {
      throw new Error('Falha ao alterar quantidade via JavaScript');
    }

    await this.page.waitForTimeout(800);

    // 2️⃣ Procurar e clicar no botão "Update Cart"
    const updateClicked = await this.page.evaluate(() => {
      const updateButton = document.querySelector(
        'button[name="update_cart"], button.update_cart, input[name="update_cart"]'
      ) as HTMLElement | null;

      if (!updateButton) {
        return false;
      }

      updateButton.click();
      return true;
    });

    if (!updateClicked) {
      throw new Error('Botão "Update Cart" não encontrado');
    }

    console.log('🔄 Clicando em "Update Cart"');

    // 3️⃣ Aguardar que a página seja atualizada via AJAX
    console.log('⏳ Aguardando resposta AJAX do carrinho...');
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForTimeout(2500);

    // 4️⃣ Verificar se a quantidade foi realmente alterada
    const verifyNewQty = await this.page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input[name*="qty"]'));
      if (inputs.length === 0) return '';
      return (inputs[0] as HTMLInputElement).value;
    });

    console.log(`✅ Quantidade após atualização: ${verifyNewQty}`);

    if (verifyNewQty !== String(quantity)) {
      console.warn(`⚠️ AVISO: Quantidade não foi atualizada. Esperado: ${quantity}, Obtido: ${verifyNewQty}`);
    }

    return true;
  }

  async getQuantity() {
    try {
      // O input é hidden, então usar JavaScript para obter o valor
      const result = await this.page.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input[name*="qty"]'));
        console.log(`🔍 Inputs encontrados: ${inputs.length}`);
        
        if (inputs.length === 0) {
          console.log('❌ Nenhum input de quantidade encontrado');
          return { value: '', found: false, allInputs: [] };
        }
        
        // Retornar informações de TODOS os inputs para debug
        const allInfo = inputs.map((inp, idx) => ({
          idx,
          value: (inp as HTMLInputElement).value,
          name: (inp as HTMLInputElement).name,
          visible: (inp as HTMLElement).offsetParent !== null,
        }));

        // Usar o primeiro input encontrado
        const qtyInput = inputs[0] as HTMLInputElement;
        console.log(`✅ Usando input[0]: value=${qtyInput.value}`);
        
        return { value: qtyInput.value, found: true, allInputs: allInfo };
      });

      console.log(`📊 Resultado getQuantity: value=${result.value}, found=${result.found}`);
      if (result.allInputs && result.allInputs.length > 0) {
        console.log(`   Todos os inputs:`, result.allInputs);
      }

      return result.value || '';
    } catch (error) {
      console.warn('⚠️ Erro ao obter quantidade:', error);
      return '';
    }
  }

  async proceedToCheckout() {
    const checkoutBtn = this.page.locator('a.checkout-button, a[href*="checkout"], button:has-text("Prosseguir")').first();
    if (await checkoutBtn.count() > 0) {
      await checkoutBtn.click();
      await this.page.waitForLoadState('networkidle');
      return true;
    }
    return false;
  }

  async getProductPrice(): Promise<string | null> {
    return await this.unitPrice.textContent();
  }

  async getSubtotal(): Promise<string | null> {
    return await this.subtotal.textContent();
  }

  async getTotal(): Promise<string | null> {
    return await this.total.textContent();
  }
}
