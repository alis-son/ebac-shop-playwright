import { test, expect } from '../../src/fixtures/test-fixtures';
import { HomePage } from '../../src/pages/HomePage';
import { ProductPage } from '../../src/pages/ProductPage';

test('escolher um produto da vitrine', async ({ page }) => {
  const home = new HomePage(page);
  const product = new ProductPage(page);

  // Ir para a homepage
  await home.goto();

  // ✅ 1️⃣ Capturar nome do primeiro produto
  const productName = await home.getFirstProductName();
  expect(productName).toBeTruthy();
  console.log(`\n✅ Produto selecionado: ${productName}`);

  // ✅ 2️⃣ Clicar no produto
  await home.clickFirstProduct();

  // ✅ 3️⃣ Validar URL mudou para página de detalhe
  await expect(page).toHaveURL(/product|produto/);
  console.log(`✅ URL mudou: ${page.url()}`);

  // ✅ 4️⃣ Validar nome do produto está na página
  await expect(product.name).toBeVisible();
  const displayedName = await product.name.textContent();
  expect(displayedName).toContain(productName!);
  console.log(`✅ Nome do produto exibido: ${displayedName?.trim()}`);

  // ✅ 5️⃣ Validar preço está visível
  await expect(product.price).toBeVisible();
  const priceText = await product.price.textContent();
  expect(priceText).toBeTruthy();
  console.log(`✅ Preço exibido: ${priceText?.trim()}`);

  // ✅ 6️⃣ Validar imagem está visível
  await expect(product.image).toBeVisible();
  const imageSrc = await product.image.getAttribute('src') ||
                   await product.image.getAttribute('data-src');
  expect(imageSrc).toBeTruthy();
  console.log(`✅ Imagem carregada`);

  // ✅ 7️⃣ Validar botão "Adicionar ao Carrinho" está habilitado
  const addButton = product.addToCartButton;
  await expect(addButton).toBeEnabled();
  const buttonText = await addButton.textContent();
  console.log(`✅ Botão de compra habilitado: "${buttonText?.trim()}"`);
});
