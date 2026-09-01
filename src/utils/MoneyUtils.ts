/**
 * Utilitários para validação matemática de valores monetários
 * Converte formatos brasileiros (R$ 1.000,00) para números
 */

export class MoneyUtils {
  /**
   * Converte string monetária brasileira para número
   * Exemplos:
   *   "R$1.000,00" → 1000
   *   "1.000,00" → 1000
   *   "R$ 1.000,00" → 1000
   *   "100,00" → 100
   */
  static parseMoneyBR(value: string | null | undefined): number {
    if (!value) return 0;

    // Remove espaços em branco
    let cleaned = String(value).trim();

    // Remove símbolo "R$" se existir
    cleaned = cleaned.replace(/R\$\s?/gi, '');

    // Remove espaços
    cleaned = cleaned.replace(/\s+/g, '');

    // Converter formato brasileiro: 1.000,00 → 1000.00
    // Remover pontos (separador de milhares)
    cleaned = cleaned.replace(/\./g, '');
    
    // Substituir vírgula por ponto (separador decimal)
    cleaned = cleaned.replace(/,/g, '.');

    // Converter para número
    const num = parseFloat(cleaned);

    return isNaN(num) ? 0 : num;
  }

  /**
   * Formata número para string monetária brasileira
   * Exemplos:
   *   1000 → "R$ 1.000,00"
   *   100.50 → "R$ 100,50"
   */
  static formatMoneyBR(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  /**
   * Valida se dois valores monetários são iguais
   * Usa tolerância de 0.01 para evitar problemas de ponto flutuante
   */
  static isEqual(value1: number, value2: number, tolerance: number = 0.01): boolean {
    return Math.abs(value1 - value2) <= tolerance;
  }

  /**
   * Calcula subtotal: preço unitário × quantidade
   */
  static calculateSubtotal(unitPrice: number, quantity: number): number {
    return unitPrice * quantity;
  }

  /**
   * Calcula total com frete e desconto
   * total = subtotal + frete - desconto
   */
  static calculateTotal(
    subtotal: number,
    shipping: number = 0,
    discount: number = 0
  ): number {
    return subtotal + shipping - discount;
  }
}

/**
 * Validador de regras de negócio do carrinho
 */
export class CartValidator {
  /**
   * Valida que subtotal = preço × quantidade
   * Exemplo de uso:
   *   const unitPrice = MoneyUtils.parseMoneyBR("R$ 100,00");
   *   const quantity = 2;
   *   const subtotalText = "R$ 200,00";
   *   CartValidator.validateSubtotalCalculation(unitPrice, quantity, subtotalText);
   */
  static validateSubtotalCalculation(
    unitPrice: number,
    quantity: number,
    actualSubtotalText: string | null | undefined
  ): {
    isValid: boolean;
    expected: number;
    actual: number;
    message: string;
  } {
    const expectedSubtotal = MoneyUtils.calculateSubtotal(unitPrice, quantity);
    const actualSubtotal = MoneyUtils.parseMoneyBR(actualSubtotalText);

    const isValid = MoneyUtils.isEqual(expectedSubtotal, actualSubtotal);

    return {
      isValid,
      expected: expectedSubtotal,
      actual: actualSubtotal,
      message: isValid
        ? `✅ Subtotal correto: ${MoneyUtils.formatMoneyBR(expectedSubtotal)}`
        : `❌ Subtotal incorreto! Esperado: ${MoneyUtils.formatMoneyBR(expectedSubtotal)}, Obtido: ${MoneyUtils.formatMoneyBR(actualSubtotal)}`,
    };
  }

  /**
   * Valida que total = subtotal (sem frete/desconto)
   */
  static validateTotalCalculation(
    subtotal: number,
    actualTotalText: string | null | undefined,
    shipping: number = 0,
    discount: number = 0
  ): {
    isValid: boolean;
    expected: number;
    actual: number;
    message: string;
  } {
    const expectedTotal = MoneyUtils.calculateTotal(subtotal, shipping, discount);
    const actualTotal = MoneyUtils.parseMoneyBR(actualTotalText);

    const isValid = MoneyUtils.isEqual(expectedTotal, actualTotal);

    return {
      isValid,
      expected: expectedTotal,
      actual: actualTotal,
      message: isValid
        ? `✅ Total correto: ${MoneyUtils.formatMoneyBR(expectedTotal)}`
        : `❌ Total incorreto! Esperado: ${MoneyUtils.formatMoneyBR(expectedTotal)}, Obtido: ${MoneyUtils.formatMoneyBR(actualTotal)}`,
    };
  }
}
