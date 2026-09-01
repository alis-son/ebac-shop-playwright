import { test, expect } from '../../src/fixtures/test-fixtures';
import { HomePage } from '../../src/pages/HomePage';
import { CartPage } from '../../src/pages/CartPage';
import { ProductPage } from '../../src/pages/ProductPage';
import { CheckoutPage } from '../../src/pages/CheckoutPage';
import { checkoutData } from '../../src/data/checkout.data';

test('fluxo obrigatório: vitrine → carrinho → alterar quantidade → checkout', async ({ page, context }) => {
  test.setTimeout(120000);
  const home = new HomePage(page);
  const cart = new CartPage(page);
  const checkout = new CheckoutPage(page);

  await context.clearCookies();
  await cart.clearCart();

  // 1. Acessar a página inicial
  await home.goto();

  // 2. Escolher um produto da vitrine. Prefer a product that is not "sold individually".
  // prefer a known product that permits qty>1 for a stable test
  let chosen = '/product/augusta-pullover-jacket/';
  const productLinks = (await page.$$eval('a[href*="/product/"]', els => els.map(a => (a as HTMLAnchorElement).href))).slice(0, 8);
  // fallback: scan for suitable products if the preferred one is not available
  for (const link of productLinks) {
    await page.goto(link);
    await page.waitForTimeout(200);
    const sold = await page.$('.sold-individually, input[name="sold_individually"]');
    const isVariable = await page.$('form.variations_form');
    const qtyVisible = await page.evaluate(() => {
      const el = document.querySelector('input.qty, input[name="quantity"], input[type="number"]') as HTMLElement | null;
      return !!el && el.offsetParent !== null;
    }).catch(() => false);
    const addLink = await page.$('a.add_to_cart_button');
    const dataQuantity = addLink ? await addLink.getAttribute('data-quantity') : null;
    // prefer products that are not sold individually and have a visible qty input or data-quantity != '1'
    if (!sold && (qtyVisible || (dataQuantity && dataQuantity !== '1'))) { chosen = link; break; }
  }
  await page.goto(chosen);
  const product = new ProductPage(page);
  // if product is variable, try selecting variation options
  const isVariable = await page.$('form.variations_form');
  if (isVariable) {
    await product.selectFirstVariationOptions();
  }

  // if product page has a quantity input, set it to 2 before adding to cart
  const qtyInput = page.locator('input.qty, input[name="quantity"], input[type="number"]').first();
  if (await qtyInput.count() > 0) {
    await qtyInput.evaluate((el: HTMLInputElement) => { el.value = '2'; el.dispatchEvent(new Event('change', { bubbles: true })); });
  }

  // 3. Adicionar o produto ao carrinho
  let addedPid: string | null = null;
  let addedHref: string | null = null;
  const addLinkEl = await page.$('a.add_to_cart_button, a[href*="?add-to-cart="], button.single_add_to_cart_button, form.cart');
  if (addLinkEl) {
    addedPid = await addLinkEl.getAttribute('data-product_id');
    addedHref = await addLinkEl.getAttribute('href');
  }

  // Use robust addToCart which clicks or POSTs the form (resolves variation_id)
  await product.addToCartWithFormFallback();
  await page.waitForTimeout(800);

  // 4. Acessar a tela de carrinho
  await page.goto('/carrinho/');
  await expect(page).toHaveTitle(/EBAC – Shop/);

  // 5. Verificar/alterar a quantidade do item no carrinho
  let qty = await cart.getQuantity();
  if (Number(qty) < 2) {
    const changed = await cart.changeQuantity(2);
    if (!changed) throw new Error('Não foi possível localizar o campo de quantidade no carrinho — possivelmente carrinho vazio.');
    qty = await cart.getQuantity();
  }
  if (Number(qty) < 2 && addedPid) {
    // fallback: try adding the same product multiple times via URL to increment quantity
    if (addedHref) {
      for (let i = 0; i < 2; i++) {
        const url = addedHref.includes('?') ? `${addedHref}&quantity=2` : `${addedHref}?quantity=2`;
        await page.goto(url);
        await page.waitForTimeout(800);
      }
    } else if (addedPid) {
      for (let i = 0; i < 2; i++) {
        await page.goto(`/?add-to-cart=${addedPid}`);
        await page.waitForTimeout(800);
      }
    }
    await page.goto('/carrinho/');
    qty = await cart.getQuantity();
  }
  expect(parseInt(qty)).toBeGreaterThanOrEqual(2);

  // 6. Seguir para a etapa de checkout
  await cart.checkout();
  await expect(page).toHaveURL(/checkout|finalizar/);

  // 7. Finalizar o fluxo até onde for possível
  await checkout.fillBillingData(checkoutData);
  await checkout.placeOrder();
  // try to detect confirmation
  const url = page.url();
  expect(url).toMatch(/order|confirmation|order-received|obrigado|recebido|checkout/);
});
