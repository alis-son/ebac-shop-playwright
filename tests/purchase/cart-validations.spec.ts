import { test, expect } from '../../src/fixtures/test-fixtures';
import { HomePage } from '../../src/pages/HomePage';
import { ProductPage } from '../../src/pages/ProductPage';
import { CartPage } from '../../src/pages/CartPage';
import { MoneyUtils, CartValidator } from '../../src/utils/MoneyUtils';

test('CT02 - Carrinho: validar produto adicionado', async ({ page, context }) => {
  await context.clearCookies();

  const homePage = new HomePage(page);
  await homePage.goto();

  const productName = await homePage.getFirstProductName();
  await homePage.clickFirstProduct();

  const productPage = new ProductPage(page);
  await productPage.addToCart();

  const cartPage = new CartPage(page);
  await cartPage.goto();

  console.log('\n✅ Validações do Carrinho:\n');
  
  // 6 pontos de validação
  const cartProductName = await cartPage.productName.innerText();
  expect(cartProductName.length).toBeGreaterThan(0);
  console.log(`1️⃣ Nome do Produto: ${cartProductName}`);

  const quantity = await cartPage.getQuantity();
  expect(quantity).toBe('1');
  console.log(`2️⃣ Quantidade: ${quantity}`);

  const price = await cartPage.getProductPrice();
  console.log(`3️⃣ Preço: ${price}`);

  const subtotal = await cartPage.getSubtotal();
  expect(subtotal?.length).toBeGreaterThan(0);
  console.log(`4️⃣ Subtotal: ${subtotal}`);

  const total = await cartPage.getTotal();
  expect(total?.length).toBeGreaterThan(0);
  console.log(`5️⃣ Total: ${total}`);

  await expect(page).toHaveTitle(/carrinho|cart/i);
  console.log(`6️⃣ Página: ${await page.title()}\n`);
});

test('CT03 - Carrinho: alterar quantidade e validar cálculo', async ({ page, context }) => {
  await context.clearCookies();

  const homePage = new HomePage(page);
  await homePage.goto();

  await homePage.clickFirstMultiQuantityProduct();

  const productPage = new ProductPage(page);
  await productPage.selectFirstVariationOptions();
  const priceText = await productPage.price.textContent();
  const unitPrice = MoneyUtils.parseMoneyBR(priceText);
  expect(await productPage.addToCartWithFormFallback()).toBe(true);

  const cartPage = new CartPage(page);
  await cartPage.goto();

  console.log('\n✅ Alteração de Quantidade e Validação Matemática:\n');

  const quantityBefore = await cartPage.getQuantity();
  console.log(`Quantidade antes: ${quantityBefore}`);

  // Tentar alterar quantidade
  await cartPage.changeQuantity(2);
  const quantityAfter = await cartPage.getQuantity();
  console.log(`Quantidade depois: ${quantityAfter}`);

  expect(quantityAfter).toBe('2');

  // Validar cálculo matemático
  const subtotal = await cartPage.getSubtotal();
  const validation = CartValidator.validateSubtotalCalculation(
    unitPrice,
    parseInt(quantityAfter),
    subtotal
  );

  console.log(`\n${validation.message}\n`);
  expect(validation.isValid).toBe(true);
});

test('CT04-CT05 - Carrinho: remover produto e validar estado vazio', async ({ page, context }) => {
  await context.clearCookies();

  const cartPage = new CartPage(page);
  await cartPage.clearCart();

  const homePage = new HomePage(page);
  await homePage.goto();
  await homePage.clickFirstMultiQuantityProduct();

  const productPage = new ProductPage(page);
  const productName = await productPage.getTitle();
  await productPage.selectFirstVariationOptions();
  expect(await productPage.addToCartWithFormFallback()).toBe(true);

  await cartPage.goto();
  expect(await cartPage.productName.innerText()).toContain(productName ?? '');
  console.log(`\n🛒 Produto adicionado: ${productName}`);

  await cartPage.removeFirstProduct();

  expect(await page.locator('.cart_item, tr.cart_item').count()).toBe(0);
  await expect(page.getByText(/seu carrinho está vazio|cart is empty/i)).toBeVisible();
  console.log('✅ CT04: produto removido');
  console.log('✅ CT05: carrinho vazio validado\n');
});
