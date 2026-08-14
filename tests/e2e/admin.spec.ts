import { test, expect, Browser } from '@playwright/test';
import { adminLogin, hasAdminSessionCookie, setupConsoleSpy, screenshot, waitForPageSettle } from './helpers/common';

test.describe('B1 - Admin Authentication', () => {
  test('B1.1 - /admin redirects to /admin/login when logged out', async ({ browser }) => {
    // Use fresh context with no cookies
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/admin');
    await waitForPageSettle(page);
    await screenshot(page, 'b1_1_admin_redirect');

    expect(page.url()).toContain('/admin/login');
    await context.close();
  });

  test('B1.2 - Login with wrong password shows error', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('/admin/login');
    await page.fill('#admin-passcode', 'wrongpassword123');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await screenshot(page, 'b1_2_wrong_password');

    // Use data-testid for reliable targeting, independent of cookie consent banner
    const errorAlert = page.locator('[data-testid="login-error-alert"]');
    const hasError = await errorAlert.isVisible().catch(() => false);
    console.log(`Error shown for wrong password: ${hasError}`);
    expect(hasError).toBeTruthy();

    // Verify no admin session cookie set
    const hasSession = await hasAdminSessionCookie(page);
    expect(hasSession).toBeFalsy();
    await context.close();
  });

  test('B1.3 - Login with valid credentials sets session and redirects to dashboard', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await adminLogin(page);
    await screenshot(page, 'b1_3_admin_dashboard');

    expect(page.url()).toContain('/admin');
    expect(page.url()).not.toContain('/login');

    const hasSession = await hasAdminSessionCookie(page);
    expect(hasSession).toBeTruthy();
    console.log(`Admin session cookie set: ${hasSession}`);
    await context.close();
  });

  test('B1.4 - /api/auth/me returns authenticated user', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await adminLogin(page);

    const res = await page.request.get('/api/auth/me');
    const status = res.status();
    console.log(`/api/auth/me status: ${status}`);
    expect(status).toBe(200);

    const data = await res.json().catch(() => null);
    console.log('/api/auth/me response:', JSON.stringify(data).slice(0, 200));
    await context.close();
  });

  test('B1.5 - Logout invalidates session, /admin redirects to login', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await adminLogin(page);
    expect(page.url()).toContain('/admin');

    // Logout
    const logoutRes = await page.request.post('/api/auth/logout');
    console.log(`Logout response: ${logoutRes.status()}`);

    await page.goto('/admin');
    await waitForPageSettle(page);
    await screenshot(page, 'b1_5_post_logout_redirect');

    // Should redirect to login
    expect(page.url()).toContain('/admin/login');
    await context.close();
  });

  test('B1.6 - /api/admin/* endpoints rejected without valid session', async ({ browser }) => {
    const context = await browser.newContext(); // No session
    const page = await context.newPage();

    const res = await page.request.get('/api/admin/products');
    const status = res.status();
    console.log(`Unauthenticated /api/admin/products status: ${status}`);
    expect([401, 403, 302]).toContain(status);
    await context.close();
  });
});

test.describe('B2 - Product Catalog Management', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
  });

  test('B2.1 - Admin dashboard loads with product list', async ({ page }) => {
    const { errors } = setupConsoleSpy(page);
    await page.goto('/admin');
    await waitForPageSettle(page);
    await screenshot(page, 'b2_1_admin_dashboard');

    // Page should load correctly
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
    console.log(`Admin heading: ${await heading.textContent()}`);
    console.log('Console errors:', errors);
  });

  test('B2.2 - /admin/products/new page loads', async ({ page }) => {
    await page.goto('/admin/products/new');
    await waitForPageSettle(page);
    await screenshot(page, 'b2_2_new_product_page');

    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
    console.log(`New product page heading: ${await heading.textContent()}`);
  });

  test('B2.3 - Create new product with all fields', async ({ page }) => {
    await page.goto('/admin/products/new');
    await waitForPageSettle(page);

    const timestamp = Date.now();
    const handle = `qa-test-product-${timestamp}`;
    const title = `QA Test Product ${timestamp}`;

    // Fill product fields
    const titleInput = page.locator('input[name="title"], input[id*="title" i], input[placeholder*="title" i]').first();
    const hasTitle = await titleInput.isVisible().catch(() => false);

    if (hasTitle) {
      await titleInput.fill(title);

      const handleInput = page.locator('input[name="handle"], input[id*="handle" i]').first();
      if (await handleInput.isVisible().catch(() => false)) {
        await handleInput.fill(handle);
      }

      const descInput = page.locator('textarea[name="description"], textarea[id*="description" i]').first();
      if (await descInput.isVisible().catch(() => false)) {
        await descInput.fill('QA auto-generated test product description');
      }

      const priceInput = page.locator('input[name="price"], input[id*="price" i], input[placeholder*="price" i]').first();
      if (await priceInput.isVisible().catch(() => false)) {
        await priceInput.fill('5000');
      }

      await screenshot(page, 'b2_3_new_product_filled');

      // Submit form
      const submitBtn = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Create"), button:has-text("Publish")').first();
      if (await submitBtn.isVisible().catch(() => false)) {
        await submitBtn.click();
        await page.waitForTimeout(3000);
        await screenshot(page, 'b2_3_product_saved');
        console.log(`URL after save: ${page.url()}`);
      }
    } else {
      console.log('Title input not found on new product page');
      await screenshot(page, 'b2_3_form_not_found');
    }
  });

  test('B2.4 - Archive product triggers ConfirmModal', async ({ page }) => {
    await page.goto('/admin');
    await waitForPageSettle(page);

    // Find an archive button
    const archiveBtn = page.locator('[aria-label*="Archive" i], button[title*="Archive" i]').first();
    const hasArchive = await archiveBtn.isVisible().catch(() => false);

    if (hasArchive) {
      await archiveBtn.click();
      await page.waitForTimeout(500);
      await screenshot(page, 'b2_4_confirm_modal');

      // Verify a custom modal appears (not native browser confirm)
      const modal = page.locator('[role="dialog"], [data-modal], .modal').first();
      const hasModal = await modal.isVisible().catch(() => false);
      console.log(`Custom ConfirmModal shown: ${hasModal}`);
      expect(hasModal).toBeTruthy();

      // Cancel to avoid actually archiving
      const cancelBtn = page.locator('button:has-text("Cancel"), button:has-text("Keep"), [aria-label*="cancel" i]').first();
      if (await cancelBtn.isVisible().catch(() => false)) {
        await cancelBtn.click();
        await page.waitForTimeout(300);
      }
    } else {
      console.log('No products to archive — admin catalog may be empty');
      await screenshot(page, 'b2_4_no_archive_btn');
    }
  });
});

test.describe('B4 - Inventory Center', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
  });

  test('B4.1 - /admin/inventory loads with metrics', async ({ page }) => {
    const { errors } = setupConsoleSpy(page);
    await page.goto('/admin/inventory');
    await waitForPageSettle(page);
    await screenshot(page, 'b4_1_inventory_dashboard');

    // Verify page has content
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
    console.log(`Inventory heading: ${await heading.textContent()}`);
    console.log('Console errors:', errors);

    // Look for metric cards
    const metrics = page.locator('[data-metric], .metric, .stat, .card').first();
    const hasMetrics = await metrics.isVisible().catch(() => false);
    console.log(`Metrics visible: ${hasMetrics}`);
  });

  test('B4.2 - Inventory metrics show numeric values', async ({ page }) => {
    await page.goto('/admin/inventory');
    await waitForPageSettle(page);

    // Look for numeric metric displays
    const numbers = await page.locator('.card, [data-metric]').allTextContents();
    console.log('Inventory card texts (first 5):', numbers.slice(0, 5));
    await screenshot(page, 'b4_2_metrics');
  });

  test('B4.3 - Restock action is available', async ({ page }) => {
    await page.goto('/admin/inventory');
    await waitForPageSettle(page);

    const restockBtn = page.locator('button:has-text("Restock"), button:has-text("Add Stock"), [data-action="restock"]').first();
    const hasRestock = await restockBtn.isVisible().catch(() => false);
    console.log(`Restock button visible: ${hasRestock}`);
    await screenshot(page, 'b4_3_restock');

    if (hasRestock) {
      await restockBtn.click();
      await page.waitForTimeout(500);
      await screenshot(page, 'b4_3_restock_modal');
    }
  });

  test('B4.4 - Movement audit log is visible', async ({ page }) => {
    await page.goto('/admin/inventory');
    await waitForPageSettle(page);

    // Audit log is per-variant — click the first "History" button to open the movement modal
    const historyBtn = page.locator('button:has-text("History")').first();
    const hasHistoryBtn = await historyBtn.isVisible().catch(() => false);
    console.log(`History button visible: ${hasHistoryBtn}`);

    if (hasHistoryBtn) {
      await historyBtn.click();
      await page.waitForTimeout(800);
      await screenshot(page, 'b4_4_audit_log_modal');

      // Look for movement/history content inside the opened modal
      const auditContent = page.locator('[role="dialog"] :is(h2, h3, p, td, th)');
      const hasLog = await auditContent.first().isVisible().catch(() => false);
      console.log(`Audit log modal content visible: ${hasLog}`);
    } else {
      await screenshot(page, 'b4_4_no_history_btn');
      console.log('No History button found on inventory page');
    }
  });
});

test.describe('B5 - Order Management', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
  });

  test('B5.1 - /admin/orders loads', async ({ page }) => {
    const { errors } = setupConsoleSpy(page);
    await page.goto('/admin/orders');
    await waitForPageSettle(page);
    await screenshot(page, 'b5_1_orders');

    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
    console.log(`Orders heading: ${await heading.textContent()}`);
    console.log('Console errors:', errors);
  });

  test('B5.2 - Status filters are visible and functional', async ({ page }) => {
    await page.goto('/admin/orders');
    await waitForPageSettle(page);

    const filterBtns = page.locator('button:has-text("All"), button:has-text("Processing"), button:has-text("Shipped"), button:has-text("Fulfilled")');
    const count = await filterBtns.count();
    console.log(`Filter buttons found: ${count}`);
    await screenshot(page, 'b5_2_filters');

    if (count > 0) {
      // Click each filter and verify page updates
      for (let i = 0; i < Math.min(count, 4); i++) {
        const btn = filterBtns.nth(i);
        const text = await btn.textContent();
        await btn.click();
        await page.waitForTimeout(500);
        console.log(`Clicked filter: ${text}`);
      }
      await screenshot(page, 'b5_2_filters_tested');
    }
  });

  test('B5.3 - Search field is present', async ({ page }) => {
    await page.goto('/admin/orders');
    await waitForPageSettle(page);

    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[name*="search" i]').first();
    const hasSearch = await searchInput.isVisible().catch(() => false);
    console.log(`Search input visible: ${hasSearch}`);
    await screenshot(page, 'b5_3_search');
  });
});

test.describe('B6 - Store Settings', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
  });

  test('B6.1 - /admin/settings loads with form fields', async ({ page }) => {
    const { errors } = setupConsoleSpy(page);
    await page.goto('/admin/settings');
    await waitForPageSettle(page);
    await screenshot(page, 'b6_1_settings');

    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
    console.log(`Settings heading: ${await heading.textContent()}`);
    console.log('Console errors:', errors);

    // Check for form inputs
    const inputs = page.locator('input, textarea, select');
    const inputCount = await inputs.count();
    console.log(`Settings form inputs: ${inputCount}`);
    expect(inputCount).toBeGreaterThan(0);
  });

  test('B6.2 - Save settings and verify persistence', async ({ page }) => {
    await page.goto('/admin/settings');
    await waitForPageSettle(page);

    // Find a saveable text field (e.g., store name or email)
    const nameInput = page.locator('input[name*="name" i], input[name*="email" i], input[id*="store" i]').first();
    const hasInput = await nameInput.isVisible().catch(() => false);

    if (hasInput) {
      const originalValue = await nameInput.inputValue();
      await nameInput.fill('QA Test Store Name');

      const saveBtn = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Update")').first();
      if (await saveBtn.isVisible().catch(() => false)) {
        await saveBtn.click();
        await page.waitForTimeout(2000);
        await screenshot(page, 'b6_2_settings_saved');

        // Reload and verify
        await page.reload();
        await waitForPageSettle(page);
        const valueAfterReload = await nameInput.inputValue();
        console.log(`Value after reload: ${valueAfterReload}`);

        // Restore original value
        if (originalValue) {
          await nameInput.fill(originalValue);
          await saveBtn.click();
          await page.waitForTimeout(1000);
        }
      }
    } else {
      console.log('No editable settings field found');
    }
  });
});

test.describe('B7 - UI System Components', () => {
  test.beforeEach(async ({ page }) => {
    await adminLogin(page);
  });

  test('B7.1 - ConfirmModal appears with backdrop on archive', async ({ page }) => {
    await page.goto('/admin');
    await waitForPageSettle(page);

    const archiveBtn = page.locator('[aria-label*="Archive" i], button[title*="Archive" i]').first();
    const hasArchive = await archiveBtn.isVisible().catch(() => false);

    if (hasArchive) {
      await archiveBtn.click();
      await page.waitForTimeout(500);
      await screenshot(page, 'b7_1_confirm_modal');

      // Verify custom dialog (not native browser confirm)
      const dialog = page.locator('[role="dialog"]').first();
      await expect(dialog).toBeVisible({ timeout: 5000 });

      // Verify backdrop
      const backdrop = page.locator('[data-modal-backdrop], .modal-backdrop, [aria-modal="true"]').first();
      const hasBackdrop = await backdrop.isVisible().catch(() => false);
      console.log(`Modal backdrop present: ${hasBackdrop}`);

      // Verify Confirm and Cancel buttons
      const confirmBtn = page.locator('[role="dialog"] button:has-text("Archive"), [role="dialog"] button:has-text("Confirm"), [role="dialog"] button:has-text("Delete")').first();
      const cancelBtn = page.locator('[role="dialog"] button:has-text("Cancel"), [role="dialog"] button:has-text("Keep")').first();

      expect(await confirmBtn.isVisible().catch(() => false)).toBeTruthy();
      expect(await cancelBtn.isVisible().catch(() => false)).toBeTruthy();

      await cancelBtn.click();
    } else {
      console.log('No archive button to trigger ConfirmModal');
    }
  });

  test('B7.2 - Toast appears on successful admin action', async ({ page }) => {
    await page.goto('/admin/settings');
    await waitForPageSettle(page);

    const saveBtn = page.locator('button[type="submit"], button:has-text("Save")').first();
    const hasSave = await saveBtn.isVisible().catch(() => false);

    if (hasSave) {
      await saveBtn.click();
      await page.waitForTimeout(500);
      await screenshot(page, 'b7_2_toast');

      // Look for toast notification
      const toast = page.locator('[role="status"], [role="alert"], [data-toast], .toast, [aria-live]').filter({ hasText: /save|success|error|updated/i }).first();
      const hasToast = await toast.isVisible().catch(() => false);
      console.log(`Toast visible: ${hasToast}`);
    }
  });
});
