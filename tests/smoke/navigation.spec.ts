import { test, expect } from '../../src/fixtures/test-fixtures';
import { HomePage } from '../../src/pages/HomePage';

test('navegação básica', async ({ page }) => {
  const home = new HomePage(page);
  await home.goto();
  
  // ✅ URL - Validar que acessou a homepage
  await expect(page).toHaveURL(
    'http://lojaebac.ebaconline.art.br/'
  );
  
  // ✅ Página carregada - Validar título da página
  await expect(page).toHaveTitle(/EBAC – Shop/);
  
  // ✅ Vitrine - Validar que existem produtos
  await page.waitForTimeout(2000); // Aguardar renderização JS
  const products = await page.locator('.product').all();
  expect(products.length).toBeGreaterThan(0);
  
  // ✅ Informações mínimas do produto
  // Validar que o primeiro produto possui: nome, imagem e link para visualizar
  if (products.length > 0) {
    const firstProduct = products[0];
    
    // 1️⃣ Produto está visível
    await expect(firstProduct).toBeVisible();
    
    // 2️⃣ Link/ação para visualizar produto
    const productLink = firstProduct.locator('a.product-image');
    await expect(productLink).toBeVisible();
    const href = await productLink.getAttribute('href');
    expect(href).toBeTruthy();
    expect(href).toMatch(/\/product\//);
    
    // 3️⃣ Imagem do produto
    const productImage = firstProduct.locator('img').first();
    await expect(productImage).toBeVisible();
    const imgSrc = await productImage.getAttribute('src') || 
                   await productImage.getAttribute('data-src');
    expect(imgSrc).toBeTruthy();
    
    // 4️⃣ Nome do produto (validar via title do link)
    const productTitle = await productLink.getAttribute('title');
    expect(productTitle).toBeTruthy();
  }
});
