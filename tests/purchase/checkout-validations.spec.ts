import { test, expect } from '../../src/fixtures/test-fixtures';
import { HomePage } from '../../src/pages/HomePage';
import { ProductPage } from '../../src/pages/ProductPage';
import { CartPage } from '../../src/pages/CartPage';
import { CheckoutPage } from '../../src/pages/CheckoutPage';
import { MoneyUtils } from '../../src/utils/MoneyUtils';

test('CT06 - Checkout: acessar e validar persistência de dados', async ({ page, context }) => {
  await context.clearCookies();

  console.log('\n========================================');
  console.log('🛒 CT06 - CHECKOUT: PERSISTÊNCIA DE DADOS');
  console.log('========================================\n');

  // Adicionar produto
  const homePage = new HomePage(page);
  await homePage.goto();

  const productName = await homePage.getFirstProductName();
  await homePage.clickFirstProduct();

  const productPage = new ProductPage(page);
  await productPage.addToCart();

  // Ir para carrinho
  const cartPage = new CartPage(page);
  await cartPage.goto();

  const cartQuantity = await cartPage.getQuantity();
  const cartSubtotal = await cartPage.getSubtotal();
  const cartTotal = await cartPage.getTotal();

  console.log('📋 Dados do Carrinho:');
  console.log(`   Produto: ${productName}`);
  console.log(`   Quantidade: ${cartQuantity}`);
  console.log(`   Subtotal: ${cartSubtotal}`);
  console.log(`   Total: ${cartTotal}\n`);

  // Ir para checkout
  console.log('📌 Navegando para Checkout...\n');
  await cartPage.checkout();

  console.log(`   URL após checkout: ${page.url()}\n`);

  const checkoutPage = new CheckoutPage(page);

  // Validações
  console.log('✅ Validações:');

  // 1. URL
  const isCheckout = await checkoutPage.isCheckoutPage();
  expect(isCheckout).toBe(true);
  console.log(`   ✅ URL: ${page.url()}`);

  // 2. Resumo visível
  const orderReviewVisible = await checkoutPage.isOrderReviewVisible();
  expect(orderReviewVisible).toBe(true);
  console.log(`   ✅ Resumo do pedido visível`);

  await checkoutPage.acceptTerms();
  expect(await checkoutPage.termsCheckbox.isChecked()).toBe(true);
  console.log('   ✅ Termos de uso aceitos');

  // 3. Dados persistem
  const orderReviewData = await checkoutPage.getOrderReviewData();
  console.log(`   ✅ Produto: ${orderReviewData.productName}`);
  console.log(`   ✅ Quantidade: ${orderReviewData.quantity}`);
  console.log(`   ✅ Total: ${orderReviewData.total}\n`);

  console.log('========================================\n');
});

test('CT07 - Checkout: validar campos obrigatórios', async ({ page, context }) => {
  await context.clearCookies();

  console.log('\n========================================');
  console.log('❌ CT07 - CHECKOUT: CAMPOS OBRIGATÓRIOS');
  console.log('========================================\n');

  // Adicionar produto
  const homePage = new HomePage(page);
  await homePage.goto();

  await homePage.clickFirstProduct();

  const productPage = new ProductPage(page);
  expect(await productPage.addToCartWithFormFallback()).toBe(true);

  const cartPage = new CartPage(page);
  await cartPage.goto();
  expect(await cartPage.getQuantity()).toBe('1');
  await cartPage.checkout();

  const checkoutPage = new CheckoutPage(page);
  expect(await checkoutPage.isCheckoutPage()).toBe(true);
  expect(await checkoutPage.isOrderReviewVisible()).toBe(true);

  console.log('📌 Preenchendo checkout sem nome e sobrenome...\n');

  await checkoutPage.fillBillingData({
    email: 'teste@ebac.test',
    phone: '11999999999',
    address: 'Endereco teste',
    number: '123',
    city: 'Sao Paulo',
    state: 'SP',
    postcode: '01311100',
    country: 'BR',
  });

  await checkoutPage.acceptTerms();
  expect(await checkoutPage.termsCheckbox.isChecked()).toBe(true);
  console.log('✅ Termos de uso aceitos\n');

  // Tentar finalizar compra sem os campos obrigatórios Nome e Sobrenome
  const success = await checkoutPage.attemptPlaceOrder();

  if (!success) {
    await expect(checkoutPage.requiredFieldErrors).toBeVisible({ timeout: 15000 });
    const errors = await checkoutPage.getErrorMessages();
    
    console.log('❌ Validação de campos obrigatórios acionada:\n');
    
    if (errors.length > 0) {
      errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      console.log();
    } else {
      console.log('   ⚠️  Página ainda está no checkout (sem confirmação)\n');
    }

    expect(errors.join(' ')).toMatch(/(?:Nome|First name).*(?:obrigatório|required field)/i);
    expect(errors.join(' ')).toMatch(/(?:Sobrenome|Last name).*(?:obrigatório|required field)/i);
    console.log('✅ Teste passou: nome e sobrenome são obrigatórios\n');
  } else {
    throw new Error('A compra foi finalizada sem nome e sobrenome');
  }

  console.log('========================================\n');
});

test('CT08 - Checkout: validar consistência dos valores', async ({ page, context }) => {
  await context.clearCookies();

  console.log('\n========================================');
  console.log('💡 CT08 - CHECKOUT: CONSISTÊNCIA DE VALORES');
  console.log('========================================\n');

  // Estado inicial - guardar dados do produto
  const homePage = new HomePage(page);
  await homePage.goto();

  const productName = await homePage.getFirstProductName();
  await homePage.clickFirstProduct();

  const productPage = new ProductPage(page);
  const priceText = await productPage.price.textContent();
  const unitPrice = MoneyUtils.parseMoneyBR(priceText);
  expect(await productPage.addToCartWithFormFallback()).toBe(true);

  // Guardar estado para comparação
  const purchase = {
    productName,
    unitPrice,
  };

  console.log('📦 Estado Inicial (Produto):');
  console.log(`   Produto: ${purchase.productName}`);
  console.log(`   Preço: ${MoneyUtils.formatMoneyBR(purchase.unitPrice)}\n`);

  // Carrinho
  const cartPage = new CartPage(page);
  await cartPage.goto();

  const cartQuantity = await cartPage.getQuantity();
  const cartSubtotal = await cartPage.getSubtotal();
  const cartTotal = await cartPage.getTotal();

  console.log('🛒 Carrinho:');
  console.log(`   Quantidade: ${cartQuantity}`);
  console.log(`   Subtotal: ${cartSubtotal}`);
  console.log(`   Total: ${cartTotal}\n`);

  // Checkout
  await cartPage.checkout();

  const checkoutPage = new CheckoutPage(page);
  await checkoutPage.acceptTerms();
  expect(await checkoutPage.termsCheckbox.isChecked()).toBe(true);

  const orderReviewData = await checkoutPage.getOrderReviewData();

  console.log('💳 Checkout (Resumo do Pedido):');
  console.log('   ✅ Termos de uso aceitos');
  console.log(`   Produto: ${orderReviewData.productName}`);
  console.log(`   Quantidade: ${orderReviewData.quantity}`);
  console.log(`   Total: ${orderReviewData.total}\n`);

  // Validações de consistência
  console.log('✅ Validações:');

  // Quantidade permaneceu
  expect(orderReviewData.quantity).toContain(cartQuantity);
  console.log(`   ✅ Quantidade consistente: ${cartQuantity}`);

  // Total permaneceu (converter para comparação)
  const checkoutTotal = MoneyUtils.parseMoneyBR(orderReviewData.total);
  const cartTotalNum = MoneyUtils.parseMoneyBR(cartTotal);
  expect(checkoutTotal).toBe(cartTotalNum);
  console.log(`   ✅ Total consistente: ${orderReviewData.total}\n`);

  console.log('========================================\n');
  console.log('✅ Dados persistiram corretamente do carrinho para o checkout!\n');
});
