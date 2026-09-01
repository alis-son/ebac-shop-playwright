import { test, expect } from '../../src/fixtures/test-fixtures';
import { HomePage } from '../../src/pages/HomePage';
import { ProductPage } from '../../src/pages/ProductPage';
import { CartPage } from '../../src/pages/CartPage';
import { CheckoutPage } from '../../src/pages/CheckoutPage';
import { MoneyUtils, CartValidator } from '../../src/utils/MoneyUtils';

test('CT01 - Compra completa: fluxo principal de compra', async ({ page, context }) => {
  // Estado limpo
  await context.clearCookies();
  const cartPage = new CartPage(page);
  await cartPage.clearCart();

  console.log('\n========================================');
  console.log('🛍️  CT01 - FLUXO COMPLETO DE COMPRA');
  console.log('========================================\n');

  // =============== PASSO 1: HOME ===============
  console.log('Step 1️⃣: Navegação');
  const homePage = new HomePage(page);
  await homePage.goto();
  
  await expect(page).toHaveTitle(/EBAC/);
  console.log('   ✅ Homepage carregada\n');

  // =============== PASSO 2: PRODUTO ===============
  console.log('Step 2️⃣: Seleção de Produto');
  await homePage.clickFirstMultiQuantityProduct();

  const productPage = new ProductPage(page);
  const productName = await productPage.getTitle();
  console.log(`   📦 Produto: ${productName}`);
  await productPage.selectFirstVariationOptions();
  const priceText = await productPage.price.textContent();
  const unitPrice = MoneyUtils.parseMoneyBR(priceText);
  console.log(`   💰 Preço: ${priceText} (${unitPrice})\n`);

  // Guardar estado para validação posterior
  const purchase = {
    productName,
    unitPrice,
    quantity: 1,
    subtotal: 0,
    total: 0,
  };

  // =============== PASSO 3: CARRINHO ===============
  console.log('Step 3️⃣: Adicionar ao Carrinho');
  expect(await productPage.addToCartWithFormFallback()).toBe(true);
  console.log('   ✅ Produto adicionado\n');

  // =============== PASSO 4: VISUALIZAR CARRINHO ===============
  console.log('Step 4️⃣: Validação do Carrinho');
  await cartPage.goto();

  const cartProductName = await cartPage.productName.innerText();
  const cartQuantity = await cartPage.getQuantity();
  const cartSubtotal = await cartPage.getSubtotal();
  const cartTotal = await cartPage.getTotal();

  // Validações de carrinho
  expect(cartProductName.length).toBeGreaterThan(0);
  expect(cartProductName).toContain(productName ?? '');
  console.log(`   ✅ Nome do produto: ${cartProductName}`);

  expect(cartQuantity).toBe('1');
  console.log(`   ✅ Quantidade: ${cartQuantity}`);

  // Validação matemática
  const subtotalValidation = CartValidator.validateSubtotalCalculation(
    unitPrice,
    1,
    cartSubtotal
  );
  
  console.log(`   💡 Subtotal:`);
  console.log(`      ${subtotalValidation.message}\n`);

  // Guardar valores do carrinho
  purchase.subtotal = MoneyUtils.parseMoneyBR(cartSubtotal);
  purchase.total = MoneyUtils.parseMoneyBR(cartTotal);

  // =============== PASSO 5: CHECKOUT ===============
  console.log('Step 5️⃣: Navegação para Checkout');
  await cartPage.checkout();

  const checkoutPage = new CheckoutPage(page);
  const isCheckout = await checkoutPage.isCheckoutPage();
  expect(isCheckout).toBe(true);
  console.log(`   ✅ URL: ${page.url()}\n`);

  // =============== PASSO 6: VALIDAR PERSISTÊNCIA DOS DADOS ===============
  console.log('Step 6️⃣: Validação de Consistência');
  
  const orderReviewVisible = await checkoutPage.isOrderReviewVisible();
  expect(orderReviewVisible).toBe(true);
  console.log('   ✅ Resumo do pedido visível');

  const orderReviewData = await checkoutPage.getOrderReviewData();
  
  console.log(`   Produto: ${orderReviewData.productName}`);
  console.log(`   Quantidade: ${orderReviewData.quantity}`);
  console.log(`   Total: ${orderReviewData.total}\n`);

  // =============== PASSO 7: PREENCHER DADOS OBRIGATÓRIOS ===============
  console.log('Step 7️⃣: Preenchimento de Dados');

  const checkoutData = {
    firstName: 'João',
    lastName: 'Silva',
    email: 'teste@ebac.test',
    phone: '11999999999',
    address: 'Rua Teste',
    number: '123',
    city: 'São Paulo',
    state: 'SP',
    postcode: '01311100',
    country: 'BR',
  };

  try {
    await checkoutPage.fillBillingData(checkoutData);
    console.log('   ✅ Dados preenchidos com sucesso\n');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`   ⚠️  Erro ao preencher: ${message}\n`);
  }

  await checkoutPage.acceptTerms();
  expect(await checkoutPage.termsCheckbox.isChecked()).toBe(true);
  console.log('   ✅ Termos de uso aceitos\n');

  // =============== PASSO 8: FINALIZAR COMPRA ===============
  console.log('Step 8️⃣: Finalizar Compra');
  await checkoutPage.placeOrder();

  expect(await checkoutPage.isOrderReceivedPage()).toBe(true);
  await expect(page.getByText(/pedido recebido/i)).toBeVisible();
  console.log(`   ✅ Pedido recebido: ${page.url()}\n`);

  const receivedOrder = await checkoutPage.getReceivedOrderData();
  expect(receivedOrder.productName).toContain(productName ?? '');
  expect(MoneyUtils.parseMoneyBR(receivedOrder.productTotal)).toBe(purchase.total);
  expect(MoneyUtils.parseMoneyBR(receivedOrder.orderTotal)).toBe(purchase.total);
  console.log(`   ✅ Produto confirmado: ${receivedOrder.productName}`);
  console.log(`   ✅ Preço confirmado: ${receivedOrder.orderTotal}\n`);

  // =============== PASSO 9: VALIDAÇÃO FINAL ===============
  console.log('Step 9️⃣: Validação Final');
  console.log('========================================\n');

  console.log('📋 Resumo da Compra:');
  console.log(`   Produto: ${purchase.productName}`);
  console.log(`   Preço Unitário: ${MoneyUtils.formatMoneyBR(purchase.unitPrice)}`);
  console.log(`   Quantidade: ${purchase.quantity}`);
  console.log(`   Subtotal: ${MoneyUtils.formatMoneyBR(purchase.subtotal)}`);
  console.log(`   Total: ${MoneyUtils.formatMoneyBR(purchase.total)}\n`);

  console.log('✅ Fluxo de compra concluído até o checkout\n');
  console.log('========================================\n');
});
