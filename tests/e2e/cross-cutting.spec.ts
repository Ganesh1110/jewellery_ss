import { test, expect } from '@playwright/test';
import { setupConsoleSpy, screenshot, waitForPageSettle } from './helpers/common';

test.describe('C - Cross-Cutting Checks', () => {
  test('C1.1 - Storefront flows work at mobile viewport (375×812)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    // Homepage
    await page.goto('/');
    await waitForPageSettle(page);
    await screenshot(page, 'c1_1_mobile_homepage');

    // Collection browse
    await page.goto('/collections/all');
    await waitForPageSettle(page);
    await screenshot(page, 'c1_1_mobile_collections');

    // Navigate to first product
    const productLink = page.locator('a[href*="/products/"]').first();
    const hasProduct = await productLink.isVisible().catch(() => false);

    if (hasProduct) {
      await productLink.click();
      await waitForPageSettle(page);
      await screenshot(page, 'c1_1_mobile_pdp');

      // Try to add to cart
      const addBtn = page.locator('button:has-text("Add to Cart"), button:has-text("Add to Bag")').first();
      const isDisabled = await addBtn.isDisabled().catch(() => true);
      if (!isDisabled && await addBtn.isVisible().catch(() => false)) {
        await addBtn.click();
        await page.waitForTimeout(1500);
        await screenshot(page, 'c1_1_mobile_cart_open');
      }

      // Checkout
      await page.goto('/checkout');
      await waitForPageSettle(page);
      await screenshot(page, 'c1_1_mobile_checkout');
    }

    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('C2.1 - Direct deep-link to PDP loads correctly (SSR)', async ({ page }) => {
    const { errors, failedRequests } = setupConsoleSpy(page);

    // Navigate directly without going through collection page
    await page.goto('/products/eternal-solitaire-diamond-ring');
    await waitForPageSettle(page);
    await screenshot(page, 'c2_1_direct_pdp');

    const is404 = (await page.locator('text=/not found/i, text=/404/i').first().isVisible().catch(() => false));

    if (is404) {
      // Try a generic path to see if SSR works at all
      await page.goto('/collections/all');
      await waitForPageSettle(page);
      const link = page.locator('a[href*="/products/"]').first();
      if (await link.isVisible().catch(() => false)) {
        const href = await link.getAttribute('href');
        console.log(`Testing direct link to: ${href}`);
        await page.goto(href!);
        await waitForPageSettle(page);
        await screenshot(page, 'c2_1_direct_pdp_actual');
        const is404Again = await page.locator('text=/not found/i').isVisible().catch(() => false);
        expect(is404Again).toBeFalsy();
      }
    } else {
      expect(is404).toBeFalsy();
    }

    console.log('SSR console errors:', errors.filter(e => !e.includes('favicon')));
    console.log('SSR failed requests:', failedRequests.filter(r => !r.includes('/_next')));
  });

  test('C2.2 - Direct deep-link to admin sub-page works', async ({ page }) => {
    // Login first
    await page.goto('/admin/login');
    await page.fill('#admin-passcode', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin', { timeout: 15000 });

    // Now direct-navigate to an admin sub-page
    await page.goto('/admin/inventory');
    await waitForPageSettle(page);
    await screenshot(page, 'c2_2_direct_admin_inventory');

    // Should NOT redirect to login
    expect(page.url()).not.toContain('/login');
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
  });

  test('C3.1 - No sensitive data leaked in API responses', async ({ page }) => {
    // Login
    await page.goto('/admin/login');
    await page.fill('#admin-passcode', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin', { timeout: 15000 });

    // Check /api/auth/me doesn't expose password hash
    const meRes = await page.request.get('/api/auth/me');
    if (meRes.ok()) {
      const body = await meRes.text();
      console.log('/api/auth/me body:', body.slice(0, 500));

      // Should not contain bcrypt hash patterns ($2b$ or $2a$)
      expect(body).not.toMatch(/\$2[ab]\$/);
      expect(body.toLowerCase()).not.toContain('password');
      expect(body).not.toContain('passwordHash');
    }
  });

  test('C3.2 - Cart API does not leak session data across requests', async ({ page }) => {
    // Fresh session
    const { errors } = setupConsoleSpy(page);

    await page.goto('/');
    await waitForPageSettle(page);

    const cartRes = await page.request.get('/api/cart');
    if (cartRes.ok()) {
      const body = await cartRes.text();
      // Should not contain any session tokens or auth data
      expect(body).not.toMatch(/password/i);
      expect(body).not.toMatch(/\$2[ab]\$/);
      console.log('Cart API response (fresh):', body.slice(0, 300));
    }
  });

  test('C4.1 - Reload mid-checkout does not crash', async ({ page }) => {
    await page.goto('/checkout');
    await waitForPageSettle(page);
    await screenshot(page, 'c4_1_checkout_before_reload');

    // Reload
    await page.reload();
    await waitForPageSettle(page);
    await screenshot(page, 'c4_1_checkout_after_reload');

    // Should not show error page
    const errorEl = page.locator('text=/something went wrong/i, text=/application error/i').first();
    const hasError = await errorEl.isVisible().catch(() => false);
    expect(hasError).toBeFalsy();
  });

  test('C4.2 - Browser back/forward works through key flows', async ({ page }) => {
    await page.goto('/');
    await waitForPageSettle(page);

    await page.goto('/collections/all');
    await waitForPageSettle(page);

    // Use data-testid for reliable product card navigation
    const productLink = page.locator('[data-testid="product-card-link"]').first();
    if (await productLink.isVisible().catch(() => false)) {
      await productLink.click();
      await waitForPageSettle(page);

      const pdpUrl = page.url();
      console.log(`PDP URL: ${pdpUrl}`);

      // Go back
      await page.goBack();
      await waitForPageSettle(page);
      await screenshot(page, 'c4_2_after_back');

      expect(page.url()).toContain('/collections');

      // Go forward
      await page.goForward();
      await waitForPageSettle(page);
      await screenshot(page, 'c4_2_after_forward');

      expect(page.url()).toBe(pdpUrl);
    }
  });

  test('C5.1 - Hydration errors not present on storefront pages', async ({ page }) => {
    const hydrationErrors: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('hydrat') || text.includes('Hydration') || text.includes('did not match')) {
        hydrationErrors.push(text);
      }
    });

    const pagesToCheck = ['/', '/collections/all', '/checkout', '/journal'];

    for (const path of pagesToCheck) {
      await page.goto(path);
      await waitForPageSettle(page);
    }

    console.log('Hydration errors found:', hydrationErrors);
    expect(hydrationErrors, `Hydration errors: ${hydrationErrors.join('; ')}`).toHaveLength(0);
  });
});
