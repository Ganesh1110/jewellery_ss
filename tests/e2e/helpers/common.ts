import { Page, expect } from '@playwright/test';

export const BASE_URL = 'http://localhost:3000';
export const ADMIN_PASSWORD = 'admin123';
export const ADMIN_URL = '/admin';
export const LOGIN_URL = '/admin/login';

/**
 * Login to the admin console and wait for dashboard
 */
export async function adminLogin(page: Page, password = ADMIN_PASSWORD) {
  await page.goto(LOGIN_URL);
  await page.waitForSelector('#admin-passcode');
  await page.fill('#admin-passcode', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin', { timeout: 15000 });
}

/**
 * Logout from admin console
 */
export async function adminLogout(page: Page) {
  // Call the logout API directly
  await page.evaluate(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
  });
  await page.reload();
}

/**
 * Get the current cart item count from the page
 */
export async function getCartCount(page: Page): Promise<number> {
  try {
    const countEl = page.locator('[data-cart-count], [aria-label*="cart"], [aria-label*="Cart"]').first();
    const text = await countEl.textContent({ timeout: 3000 });
    const match = text?.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
  } catch {
    return 0;
  }
}

/**
 * Collect console errors and failed network requests
 */
export function setupConsoleSpy(page: Page): { errors: string[]; failedRequests: string[] } {
  const errors: string[] = [];
  const failedRequests: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('response', (response) => {
    if (response.status() >= 400) {
      failedRequests.push(`${response.status()} ${response.url()}`);
    }
  });

  return { errors, failedRequests };
}

/**
 * Wait for page to settle (no pending navigation or network)
 */
export async function waitForPageSettle(page: Page) {
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {
    // Ignore timeout — some pages have long-polling
  });
}

/**
 * Take a named screenshot and save it to the reports dir
 */
export async function screenshot(page: Page, name: string) {
  const safeName = name.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
  await page.screenshot({
    path: `tests/e2e/reports/screenshots/${safeName}.png`,
    fullPage: true,
  });
}

/**
 * Format a price string for comparison (strip non-numeric chars)
 */
export function parsePrice(priceStr: string): number {
  const cleaned = priceStr.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Check if the admin session cookie is set
 */
export async function hasAdminSessionCookie(page: Page): Promise<boolean> {
  const cookies = await page.context().cookies();
  return cookies.some((c) => c.name === 'sss_admin_session' && c.value.length > 0);
}
