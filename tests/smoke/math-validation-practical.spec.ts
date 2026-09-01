import { test, expect } from '../../src/fixtures/test-fixtures';
import { HomePage } from '../../src/pages/HomePage';
import { ProductPage } from '../../src/pages/ProductPage';
import { CartPage } from '../../src/pages/CartPage';
import { MoneyUtils, CartValidator } from '../../src/utils/MoneyUtils';

test('exemplo prático - validação matemática com dados reais', async ({ page, context }) => {
  // Limpar cookies para estado limpo
  await context.clearCookies();

  console.log('\n========================================');
  console.log('🎯 EXEMPLO PRÁTICO - VALIDAÇÃO MATEMÁTICA');
  console.log('========================================\n');

  // Adicionar produto ao carrinho
  const homePage = new HomePage(page);
  await homePage.goto();
  
  const productName = await homePage.getFirstProductName();
  await homePage.clickFirstProduct();

  const productPage = new ProductPage(page);
  const priceText = await productPage.price.textContent();
  const unitPrice = MoneyUtils.parseMoneyBR(priceText);
  await productPage.addToCart();

  // Ir para carrinho
  const cartPage = new CartPage(page);
  await cartPage.goto();

  console.log('✅ Produto adicionado ao carrinho\n');

  // =============== CENÁRIO 1: VALIDAÇÃO DE VALORES INICIAIS ===============
  console.log('========================================');
  console.log('📊 CENÁRIO 1: VALIDAÇÃO DE VALORES INICIAIS');
  console.log('========================================\n');

  // Capturar dados do carrinho
  const quantityInitial = await cartPage.getQuantity();
  const subtotalInitial = await cartPage.getSubtotal();
  const totalInitial = await cartPage.getTotal();

  console.log('📋 Valores Capturados:');
  console.log(`   Quantidade: ${quantityInitial}`);
  console.log(`   Subtotal: ${subtotalInitial}`);
  console.log(`   Total: ${totalInitial}\n`);

  // Validar que subtotal e total existem
  expect(subtotalInitial).toBeTruthy();
  expect(totalInitial).toBeTruthy();
  console.log('✅ Valores capturados com sucesso\n');

  // =============== CENÁRIO 2: DEMONSTRAÇÃO DE VALIDAÇÃO MATEMÁTICA ===============
  console.log('========================================');
  console.log('💡 CENÁRIO 2: VALIDAÇÃO MATEMÁTICA');
  console.log('========================================\n');

  // Validar que o subtotal faz sentido matematicamente
  const quantityNum = parseInt(quantityInitial);
  const expectedSubtotal = unitPrice * quantityNum;
  const actualSubtotal = MoneyUtils.parseMoneyBR(subtotalInitial);

  console.log('Dados da Validação:');
  console.log(`   Preço Unitário: ${MoneyUtils.formatMoneyBR(unitPrice)}`);
  console.log(`   Quantidade: ${quantityNum}`);
  console.log(`   Fórmula: ${MoneyUtils.formatMoneyBR(unitPrice)} × ${quantityNum}`);
  console.log(`   Esperado: ${MoneyUtils.formatMoneyBR(expectedSubtotal)}`);
  console.log(`   Obtido: ${MoneyUtils.formatMoneyBR(actualSubtotal)}\n`);

  // Usar CartValidator para validar
  const validation = CartValidator.validateSubtotalCalculation(
    unitPrice,
    quantityNum,
    subtotalInitial
  );

  console.log(`Resultado: ${validation.message}\n`);
  expect(validation.isValid).toBe(true);

  // =============== CENÁRIO 3: VALIDAÇÃO DE MÚLTIPLOS PRODUTOS ===============
  console.log('========================================');
  console.log('📊 CENÁRIO 3: VALIDAÇÃO DE CONSISTÊNCIA');
  console.log('========================================\n');

  // Validar que total é >= subtotal (lógica básica)
  const totalNum = MoneyUtils.parseMoneyBR(totalInitial);
  const isTotalValid = totalNum >= actualSubtotal;

  console.log('Validação de Consistência:');
  console.log(`   Total (${MoneyUtils.formatMoneyBR(totalNum)}) >= Subtotal (${MoneyUtils.formatMoneyBR(actualSubtotal)}) ?`);
  console.log(`   Resultado: ${isTotalValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}\n`);

  expect(isTotalValid).toBe(true);

  // =============== CENÁRIO 4: DEMONSTRAÇÃO COM VALORES FICTÍCIOS ===============
  console.log('========================================');
  console.log('🎓 CENÁRIO 4: COMO USAR EM TESTES REAIS');
  console.log('========================================\n');

  // Exemplo: Teste de múltiplos cenários
  const testCases = [
    { unitPrice: 100, qty: 1, expectedSubtotal: 100, actualSubtotal: "R$100,00", shouldPass: true },
    { unitPrice: 100, qty: 3, expectedSubtotal: 300, actualSubtotal: "R$300,00", shouldPass: true },
    { unitPrice: 100, qty: 3, expectedSubtotal: 300, actualSubtotal: "R$250,00", shouldPass: false },
  ];

  console.log('Exemplos de Validação:\n');

  testCases.forEach((testCase, index) => {
    const result = CartValidator.validateSubtotalCalculation(
      testCase.unitPrice,
      testCase.qty,
      testCase.actualSubtotal
    );

    const status = result.isValid === testCase.shouldPass ? '✅' : '❌';
    console.log(`${status} Caso ${index + 1}:`);
    console.log(`   Fórmula: ${MoneyUtils.formatMoneyBR(testCase.unitPrice)} × ${testCase.qty}`);
    console.log(`   Esperado: ${MoneyUtils.formatMoneyBR(testCase.expectedSubtotal)}`);
    console.log(`   Obtido: ${MoneyUtils.formatMoneyBR(result.actual)}`);
    console.log(`   Resultado: ${result.message}\n`);
  });

  // =============== RESUMO ===============
  console.log('========================================');
  console.log('📚 RESUMO - COMO USAR VALIDAÇÃO MATEMÁTICA');
  console.log('========================================\n');

  console.log('✅ Passo 1: Obter o preço unitário');
  console.log(`   const unitPrice = MoneyUtils.parseMoneyBR(priceText);`);
  console.log(`   // ${MoneyUtils.formatMoneyBR(unitPrice)}\n`);

  console.log('✅ Passo 2: Obter quantidade e subtotal do carrinho');
  console.log(`   const quantity = await cart.getQuantity();`);
  console.log(`   const subtotal = await cart.getSubtotal();`);
  console.log(`   // Quantidade: ${quantityInitial}, Subtotal: ${subtotalInitial}\n`);

  console.log('✅ Passo 3: Validar usando CartValidator');
  console.log(`   const validation = CartValidator.validateSubtotalCalculation(`);
  console.log(`     unitPrice, quantity, subtotal`);
  console.log(`   );`);
  console.log(`   expect(validation.isValid).toBe(true);\n`);

  console.log('✅ Passo 4: Obter mensagem detalhada');
  console.log(`   console.log(validation.message);`);
  console.log(`   // ${validation.message}\n`);

  console.log('========================================');
  console.log('🎯 BENEFÍCIO: Validação de Lógica de Negócio!');
  console.log('========================================\n');

  console.log('Em vez de apenas verificar se o texto existe:');
  console.log('❌ await expect(subtotal).toHaveText("R$ 1.000,00");');
  console.log('\nVocê valida a MATEMÁTICA:');
  console.log('✅ expect(validation.isValid).toBe(true);');
  console.log('✅ Detecta automaticamente cálculos errados');
  console.log('✅ Funciona com qualquer valor monetário');
  console.log('✅ Documentação clara: expected vs actual\n');

  console.log('========================================\n');
});
