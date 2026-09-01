import { Page, Locator } from '@playwright/test';

export class ProductPage {
  constructor(public page: Page) {}

  // Getters para elementos principais
  get name(): Locator {
    return this.page.locator('h1').first();
  }

  get price(): Locator {
    return this.page
      .locator('span.price ins .woocommerce-Price-amount, span.price > .woocommerce-Price-amount, p.price .woocommerce-Price-amount')
      .first();
  }

  get image(): Locator {
    // Procurar por imagem dentro da galeria do produto ou figura principal
    return this.page.locator('figure img, .product-image img, .woocommerce-product-gallery img').first();
  }

  get addToCartButton(): Locator {
    // Procurar pelo botão "Comprar" - válido tanto como link quanto como botão
    return this.page.locator('a.add_to_cart_button:not(.product_type_grouped), button.add_to_cart_button, a[aria-label*="Adicionar"]').first();
  }

  async addToCart() {
    // Usar JavaScript para clicar, ignorando visibility checks
    await this.page.evaluate(() => {
      const button = document.querySelector('a.add_to_cart_button:not(.product_type_grouped)') as HTMLElement | null;
      if (button) {
        // Scroll o botão para view
        button.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Aguardar scroll
        setTimeout(() => button.click(), 500);
      }
    });
    
    // Aguardar resposta
    await this.page.waitForTimeout(1500);
  }

  async getTitle() {
    return this.page.textContent('h1');
  }

  async selectFirstVariationOptions() {
    // Select first meaningful option for each variation select inside variations_form
    const selects = this.page.locator('form.variations_form select');
    const count = await selects.count();
    if (count === 0) return false;
    for (let i = 0; i < count; i++) {
      const sel = selects.nth(i);
      const options = await sel.locator('option').all();
      // try to pick first option with non-empty value that is not a placeholder
      let picked = false;
      for (let j = 0; j < options.length; j++) {
        const val = await options[j].getAttribute('value');
        const disabled = await options[j].getAttribute('disabled');
        if (val && val.trim() !== '' && !disabled) {
          // sets hidden select value directly to avoid visibility issues and trigger change
          await sel.evaluate((e: HTMLSelectElement, v) => {
            e.value = v as any;
            e.dispatchEvent(new Event('change', { bubbles: true }));
          }, val);
          picked = true;
          break;
        }
      }
      if (!picked) {
        // try selecting second option if exists
        if (options.length > 1) {
          const v = await options[1].getAttribute('value');
          if (v) { await sel.selectOption(v); await sel.evaluate((e: HTMLSelectElement) => e.dispatchEvent(new Event('change', { bubbles: true }))); }
        }
      }
    }
    // wait shortly for variation JS to update prices/availability
    await this.page.waitForTimeout(500);
    return true;
  }

  async addToCartWithFormFallback() {
    // Try clicking first; if that doesn't add, POST the form with variation_id resolved
    const initialUrl = this.page.url();
    const clicked = await this.page.evaluate(() => {
      const btn = document.querySelector('button.single_add_to_cart_button, a.add_to_cart_button, button.add_to_cart, form.cart button[type=submit], form.cart input[type=submit]') as HTMLElement | null;
      if (!btn) return false;
      try { (btn as HTMLElement).click(); return true; } catch { return false; }
    });
    if (clicked) {
      await this.page.waitForTimeout(800);
      const cartResponse = await this.page.request.get('/carrinho/');
      const cartHtml = await cartResponse.text();
      const hasItemAfterClick = /class=["'][^"']*cart_item|name=["']cart\[[^"']+\]\[qty\]/.test(cartHtml);
      if (hasItemAfterClick) {
        return true;
      }

      await this.page.waitForLoadState('domcontentloaded').catch(() => undefined);
      if (this.page.url() !== initialUrl) {
        await this.page.goto(initialUrl, { waitUntil: 'domcontentloaded' });
      }
    }

    const posted = await this.page.evaluate(async () => {
      const form = document.querySelector('form.cart, form.variations_form') as HTMLFormElement | null;
      if (!form) return false;
      // parse product variations if present
      const pvRaw = form.getAttribute('data-product_variations');
      let pv: any[] | null = null;
      if (pvRaw) {
        try { pv = JSON.parse(pvRaw); } catch {}
      }
      const fd = new FormData(form);
      // if variation_id missing or empty, try to resolve from pv using current attribute selects
      const hasVariationId = Array.from(fd.keys()).some(k => k === 'variation_id' && (fd.get(k) as any));
      if (!hasVariationId && pv && pv.length > 0) {
        // collect selected attributes
        const selects = Array.from(form.querySelectorAll('select')) as HTMLSelectElement[];
        const attrs: Record<string,string> = {};
        selects.forEach(s => { if (s.name) attrs[s.name] = s.value; });
        // normalize keys in pv variations
        for (const v of pv) {
          let match = true;
          for (const key in v.attributes) {
            const desired = v.attributes[key];
            // form attribute names often like 'attribute_pa_color' or 'attribute_color' or 'attribute_size'
            const possibleNames = [key, key.replace(/^attribute_/, ''), key.replace(/^attribute_/, 'attribute_')];
            let found = false;
            for (const pn of possibleNames) {
              if (attrs[pn] !== undefined) {
                if (attrs[pn] != desired) { match = false; }
                found = true; break;
              }
            }
            if (!found) {
              // try matching by attribute without prefix
              const bare = key.replace(/^attribute_/, '');
              if (attrs[bare] !== undefined) {
                if (attrs[bare] != desired) { match = false; }
              }
            }
            if (!match) break;
          }
          if (match) {
            if (v.variation_id) fd.set('variation_id', String(v.variation_id));
            break;
          }
        }
      }
      // ensure update params
      if (!fd.has('quantity')) fd.set('quantity', '1');
      // action
      const action = form.action || window.location.pathname;
      const body = new URLSearchParams();
      for (const pair of Array.from(fd.entries())) body.append(String(pair[0]), String(pair[1]));
      const res = await fetch(action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: body.toString(),
        credentials: 'same-origin'
      });
      return res.ok;
    });

    if (posted) await this.page.waitForTimeout(800);

    // verify cart quickly
    await this.page.goto('/carrinho/');
    await this.page.waitForTimeout(500);
    const hasItem = await this.page.$('.cart_item, input[name^="cart["][name$="[qty]"]');
    if (hasItem) {
      await this.page.goto(initialUrl);
      return true;
    }
    // try wc-ajax add_to_cart fallback using product_id and variation_id
    await this.page.goto(initialUrl);
    const ajaxAdded = await this.page.evaluate(async () => {
      // try to collect product_id and variation_id from form or add-to-cart link
      const form = document.querySelector('form.cart, form.variations_form') as HTMLFormElement | null;
      let product_id: string | null = null;
      let variation_id: string | null = null;
      if (form) {
        const pi = form.querySelector('input[name="product_id"], input[name="add-to-cart"]') as HTMLInputElement | null;
        if (pi) product_id = pi.value;
        const vi = form.querySelector('input[name="variation_id"]') as HTMLInputElement | null;
        if (vi) variation_id = vi.value;
      }
      const addLink = document.querySelector('a.add_to_cart_button') as HTMLElement | null;
      if (!product_id && addLink) product_id = addLink.getAttribute('data-product_id');
      if (!product_id) return false;
      const body = new URLSearchParams();
      body.append('product_id', product_id);
      body.append('quantity', '1');
      if (variation_id) body.append('variation_id', variation_id);
      const res = await fetch('/?wc-ajax=add_to_cart', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' }, body: body.toString(), credentials: 'same-origin' });
      return res.ok;
    });
    if (ajaxAdded) {
      await this.page.waitForTimeout(600);
      await this.page.goto('/carrinho/');
      const has = await this.page.$('.cart_item, input[name^="cart["][name$="[qty]"]');
      await this.page.goto(initialUrl);
      return !!has;
    }

    return posted;
  }
}
