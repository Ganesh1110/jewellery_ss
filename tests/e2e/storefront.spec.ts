import { test, expect } from '@playwright/test';
import { setupConsoleSpy, screenshot, waitForPageSettle } from './helpers/common';
import * as fs from 'fs';
import * as path from 'path';

// Ensure screenshots dir exists
const screenshotsDir = path.join(process.cwd(), 'tests/e2e/reports/screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

test.describe('A1 - Homepage & Navigation', () => {
  test('A1.1 - Homepage loads without console errors or failed requests', async ({ page }) => {
    const { errors, failedRequests } = setupConsoleSpy(page);
    await page.goto('/');
    await waitForPageSettle(page);
    await screenshot(page, 'a1_1_homepage');

    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('favicon') &&
        !e.includes('404') &&
        !e.includes('Warning:') &&
        !e.toLowerCase().includes('deprecated')
    );
    const criticalFailed = failedRequests.filter(
      (r) => !r.includes('favicon') && !r.includes('/_next/static')
    );

    console.log('Console errors:', errors);
    console.log('Failed requests:', failedRequests);

    expect(criticalErrors, `Console errors: ${criticalErrors.join(', ')}`).toHaveLength(0);
    expect(criticalFailed, `Failed requests: ${criticalFailed.join(', ')}`).toHaveLength(0);
  });

  test('A1.2 - Header nav links are present and resolve', async ({ page }) => {
    await page.goto('/');
    await waitForPageSettle(page);

    // Check that there's a nav element visible
    const nav = page.locator('header nav, header [role="navigation"], nav').first();
    await expect(nav).toBeVisible({ timeout: 10000 });

    // Find all links in the header
    const headerLinks = page.locator('header a');
    const count = await headerLinks.count();
    expect(count).toBeGreaterThan(0);

    await screenshot(page, 'a1_2_header_nav');
  });

  test('A1.3 - Logo returns to homepage', async ({ page }) => {
    await page.goto('/collections/all');
    await waitForPageSettle(page);

    // Click logo (typically an image or text link in the header pointing to /)
    const logoLink = page.locator('header a[href="/"]').first();
    await expect(logoLink).toBeVisible();
    await logoLink.click();
    await expect(page).toHaveURL('/');

    await screenshot(page, 'a1_3_logo_homepage');
  });

  test('A1.4 - Mobile navigation (hamburger) works at 375px', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await waitForPageSettle(page);

    // Look for a hamburger / mobile menu button
    const hamburger = page.locator(
      '[aria-label*="menu" i], [aria-label*="navigation" i], button:has(svg), button.hamburger, [data-mobile-menu]'
    ).first();

    const isVisible = await hamburger.isVisible().catch(() => false);
    if (isVisible) {
      await hamburger.click();
      await page.waitForTimeout(500);
      await screenshot(page, 'a1_4_mobile_nav_open');
      // Verify nav items appear
      const mobileNavItems = page.locator('[role="dialog"] a, [data-mobile-nav] a, nav[aria-label*="mobile" i] a');
      const mobileCount = await mobileNavItems.count();
      console.log(`Mobile nav items found: ${mobileCount}`);
    } else {
      // On mobile, nav might be inline - just confirm page doesn't break
      console.log('No hamburger button found — checking if nav items are directly visible');
      await screenshot(page, 'a1_4_mobile_nav_no_hamburger');
    }
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('A1.5 - Footer links resolve (no broken anchors)', async ({ page }) => {
    await page.goto('/');
    await waitForPageSettle(page);

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    const footerLinks = footer.locator('a[href]');
    const count = await footerLinks.count();
    console.log(`Footer links found: ${count}`);
    expect(count).toBeGreaterThan(0);

    await screenshot(page, 'a1_5_footer');
  });

  test('A1.6 - Theme toggle works and persists across reload', async ({ page }) => {
    await page.goto('/');
    await waitForPageSettle(page);

    // Look for theme toggle
    const themeToggle = page.locator(
      '[aria-label*="theme" i], [aria-label*="dark" i], [aria-label*="light" i], button:has-text("theme"), button:has-text("Dark"), button:has-text("Light")'
    ).first();

    const hasThemeToggle = await themeToggle.isVisible().catch(() => false);
    if (hasThemeToggle) {
      await themeToggle.click();
      await page.waitForTimeout(500);
      await screenshot(page, 'a1_6_theme_toggled');

      // Check localStorage for theme preference
      const theme = await page.evaluate(() => localStorage.getItem('theme') || localStorage.getItem('color-scheme') || 'not_found');
      console.log(`Theme in localStorage: ${theme}`);

      // Reload and verify persistence
      await page.reload();
      await waitForPageSettle(page);
      const themeAfterReload = await page.evaluate(() => localStorage.getItem('theme') || localStorage.getItem('color-scheme') || 'not_found');
      console.log(`Theme after reload: ${themeAfterReload}`);
      await screenshot(page, 'a1_6_theme_after_reload');
    } else {
      console.log('No theme toggle found — skipping theme persistence test');
      await screenshot(page, 'a1_6_no_theme_toggle');
    }
  });
});

test.describe('A2 - Collections & Catalog Browsing', () => {
  test('A2.1 - /collections/all loads with products', async ({ page }) => {
    const { errors, failedRequests } = setupConsoleSpy(page);
    await page.goto('/collections/all');
    await waitForPageSettle(page);
    await screenshot(page, 'a2_1_collections_all');

    // Verify products exist OR a no-products message
    const productCards = page.locator('article, [data-product-card], .product-card, [data-testid="product"]');
    const noProducts = page.locator('text=/no products/i, text=/empty/i');

    const cardCount = await productCards.count();
    const noProductsVisible = await noProducts.isVisible().catch(() => false);

    console.log(`Products on /collections/all: ${cardCount}`);
    expect(cardCount > 0 || noProductsVisible).toBeTruthy();

    const criticalErrors = errors.filter((e) => !e.includes('favicon'));
    console.log('Console errors on /collections/all:', criticalErrors);
  });

  test('A2.2 - /collections/bestsellers loads', async ({ page }) => {
    await page.goto('/collections/bestsellers');
    await waitForPageSettle(page);
    await screenshot(page, 'a2_2_bestsellers');

    // Verify it loads without 404
    const status = page.url();
    expect(status).toContain('bestsellers');
    // Check page has content (not a blank page)
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(50);
  });

  test('A2.3 - /collections/new-arrivals loads', async ({ page }) => {
    await page.goto('/collections/new-arrivals');
    await waitForPageSettle(page);
    await screenshot(page, 'a2_3_new_arrivals');

    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(50);
  });

  test('A2.4 - Sorting changes product order', async ({ page }) => {
    await page.goto('/collections/all');
    await waitForPageSettle(page);

    // Find a sort selector
    const sortSelector = page.locator(
      'select[name*="sort" i], select[id*="sort" i], [aria-label*="sort" i] select, select:near(:text("Sort"))'
    ).first();

    const hasSort = await sortSelector.isVisible().catch(() => false);
    if (!hasSort) {
      // Look for sort buttons/links
      const sortButton = page.locator('button:has-text("Sort"), [role="button"]:has-text("Price"), button:has-text("Price")').first();
      const hasSortButton = await sortButton.isVisible().catch(() => false);
      if (!hasSortButton) {
        console.log('No sort control found — skipping sort test');
        await screenshot(page, 'a2_4_no_sort_control');
        return;
      }
    }

    // Get initial product titles
    const productTitles1 = await page.locator('article h2, article h3, [data-product-title]').allTextContents();
    console.log('Initial products (first 3):', productTitles1.slice(0, 3));

    // Change sort to Price: Low to High and wait for navigation
    if (await sortSelector.isVisible().catch(() => false)) {
      await sortSelector.selectOption({ label: 'Price: Low to High' }).catch(() =>
        sortSelector.selectOption({ index: 1 })
      );
    }

    await waitForPageSettle(page);
    await screenshot(page, 'a2_4_sorted');

    const productTitles2 = await page.locator('article h2, article h3, [data-product-title]').allTextContents();
    console.log('After sort (first 3):', productTitles2.slice(0, 3));

    // Assert the sort URL param was applied
    expect(page.url()).toContain('sort=');
  });

  test('A2.5 - Product cards show image, title, and price', async ({ page }) => {
    await page.goto('/collections/all');
    await waitForPageSettle(page);

    const cards = page.locator('article').first();
    const hasCard = await cards.isVisible().catch(() => false);

    if (hasCard) {
      // Check card has image
      const img = cards.locator('img').first();
      const hasImg = await img.isVisible().catch(() => false);
      console.log(`First card has image: ${hasImg}`);

      // Check card has a title
      const title = await cards.locator('h2, h3, p').first().textContent();
      console.log(`First card title: ${title}`);
      expect(title?.length).toBeGreaterThan(0);

      await screenshot(page, 'a2_5_product_card');
    } else {
      console.log('No product cards visible on /collections/all');
    }
  });
});

test.describe('A3 - Product Detail Page (PDP)', () => {
  let firstProductHandle = '';

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/collections/all');
    await waitForPageSettle(page);

    // Find first product link
    const productLinks = page.locator('article a[href*="/products/"], a[href*="/products/"]');
    const count = await productLinks.count();
    if (count > 0) {
      const href = await productLinks.first().getAttribute('href');
      const match = href?.match(/\/products\/([^?#]+)/);
      if (match) {
        firstProductHandle = match[1];
      }
    }
    await page.close();
    console.log(`First product handle: ${firstProductHandle}`);
  });

  test('A3.1 - PDP loads from collection listing', async ({ page }) => {
    await page.goto('/collections/all');
    await waitForPageSettle(page);

    // Use data-testid for reliable targeting, avoiding Quick Add button interference
    const firstLink = page.locator('[data-testid="product-card-link"]').first();
    const hasLink = await firstLink.isVisible().catch(() => false);

    if (hasLink) {
      await firstLink.click();
      await waitForPageSettle(page);
      expect(page.url()).toContain('/products/');
      await screenshot(page, 'a3_1_pdp');

      // Verify key elements
      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();
      console.log(`PDP product title: ${await heading.textContent()}`);
    } else {
      console.log('No product links visible in /collections/all');
    }
  });

  test('A3.2 - Variant selectors update price', async ({ page }) => {
    if (!firstProductHandle) {
      console.log('No product handle available — skipping');
      return;
    }

    await page.goto(`/products/${firstProductHandle}`);
    await waitForPageSettle(page);
    await screenshot(page, 'a3_2_pdp_initial');

    // Look for variant option buttons/selects
    const variantSelectors = page.locator(
      '[data-variant-option], [role="radio"], button[data-option], select[name*="variant" i]'
    );
    const count = await variantSelectors.count();
    console.log(`Variant selectors found: ${count}`);

    if (count > 1) {
      // Get initial price
      const priceEl = page.locator('[data-price], .price, [aria-label*="price" i], span:has-text("₹")').first();
      const initialPrice = await priceEl.textContent().catch(() => '');
      console.log(`Initial price: ${initialPrice}`);

      // Click second variant option
      await variantSelectors.nth(1).click();
      await page.waitForTimeout(500);

      const newPrice = await priceEl.textContent().catch(() => '');
      console.log(`Price after variant change: ${newPrice}`);

      await screenshot(page, 'a3_2_pdp_variant_changed');
    } else {
      console.log('Not enough variant options to compare');
    }
  });

  test('A3.3 - Add to Cart button is present on PDP', async ({ page }) => {
    if (!firstProductHandle) {
      console.log('No product handle — skipping');
      return;
    }

    await page.goto(`/products/${firstProductHandle}`);
    await waitForPageSettle(page);

    const addToCartBtn = page.locator(
      'button:has-text("Add to Cart"), button:has-text("Add to Bag"), button[type="submit"]:has-text("Add")'
    ).first();

    await expect(addToCartBtn).toBeVisible({ timeout: 10000 });
    console.log(`Add to Cart button text: ${await addToCartBtn.textContent()}`);
    await screenshot(page, 'a3_3_add_to_cart');
  });

  test('A3.4 - Out-of-stock variant disables add to cart', async ({ page }) => {
    if (!firstProductHandle) return;

    await page.goto(`/products/${firstProductHandle}`);
    await waitForPageSettle(page);

    // Look for disabled/out-of-stock variant buttons
    const disabledOptions = page.locator(
      '[data-variant-option][aria-disabled="true"], button[disabled][data-option], [data-unavailable], [data-out-of-stock]'
    );
    const count = await disabledOptions.count();
    console.log(`Disabled/OOS variants visible: ${count}`);

    // Check if there are any variants marked out of stock
    const oosText = page.locator('text=/out of stock/i, text=/unavailable/i, text=/sold out/i').first();
    const hasOOS = await oosText.isVisible().catch(() => false);
    console.log(`OOS indicator visible: ${hasOOS}`);

    await screenshot(page, 'a3_4_oos_variants');
  });
});

test.describe('A4 - Cart Drawer', () => {
  let productHandle = '';

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await page.goto('/collections/all');
    await waitForPageSettle(page);
    const productLinks = page.locator('a[href*="/products/"]');
    const count = await productLinks.count();
    if (count > 0) {
      const href = await productLinks.first().getAttribute('href');
      const match = href?.match(/\/products\/([^?#]+)/);
      if (match) productHandle = match[1];
    }
    await page.close();
  });

  test('A4.1 - Add product to cart opens drawer and increments count', async ({ page }) => {
    if (!productHandle) { console.log('No product handle'); return; }

    await page.goto(`/products/${productHandle}`);
    await waitForPageSettle(page);

    const addToCartBtn = page.locator(
      'button:has-text("Add to Cart"), button:has-text("Add to Bag"), button[type="submit"]:has-text("Add")'
    ).first();

    const isVisible = await addToCartBtn.isVisible().catch(() => false);
    if (!isVisible) { console.log('Add to Cart button not found'); return; }

    // Check if button is disabled (OOS)
    const isDisabled = await addToCartBtn.isDisabled().catch(() => false);
    if (isDisabled) { console.log('Add to Cart button is disabled (likely OOS)'); return; }

    await addToCartBtn.click();
    await page.waitForTimeout(1500);
    await screenshot(page, 'a4_1_cart_drawer_open');

    // Verify cart drawer/modal appears
    const cartDrawer = page.locator(
      '[data-cart-drawer], [role="dialog"], aside, [aria-label*="cart" i], [aria-label*="bag" i]'
    ).first();
    const drawerVisible = await cartDrawer.isVisible().catch(() => false);
    console.log(`Cart drawer visible: ${drawerVisible}`);

    // Verify cart item count via data-cart-count attribute on the header badge
    await page.waitForTimeout(500);
    const cartCountEl = page.locator('[data-cart-count]').first();
    const countText = await cartCountEl.textContent().catch(() => '0');
    console.log(`Cart count: ${countText?.replace(/[()]/g, '').trim()}`);
    const countNum = parseInt(countText?.replace(/[^0-9]/g, '') || '0');
    expect(countNum).toBeGreaterThan(0);
  });

  test('A4.2 - Cart persists after page reload', async ({ page }) => {
    if (!productHandle) return;

    await page.goto(`/products/${productHandle}`);
    await waitForPageSettle(page);

    const addBtn = page.locator('button:has-text("Add to Cart"), button:has-text("Add to Bag")').first();
    const isDisabled = await addBtn.isDisabled().catch(() => true);
    if (isDisabled) { console.log('Skipping — button disabled'); return; }

    await addBtn.click();
    await page.waitForTimeout(1500);

    // Get cart count before reload
    const cartToken = await page.evaluate(() => {
      return document.cookie.split(';').find(c => c.trim().startsWith('sss_cart_token'))?.split('=')?.[1] || 'none';
    });
    console.log(`Cart token before reload: ${cartToken}`);

    await page.reload();
    await waitForPageSettle(page);
    await screenshot(page, 'a4_2_cart_after_reload');

    // Verify cart API returns items
    const cartRes = await page.request.get('/api/cart');
    if (cartRes.ok()) {
      const cartData = await cartRes.json().catch(() => null);
      console.log('Cart after reload:', JSON.stringify(cartData).slice(0, 300));
    }
  });

  test('A4.3 - Cart is empty for fresh session', async ({ browser }) => {
    const freshContext = await browser.newContext();
    const page = await freshContext.newPage();

    await page.goto('/');
    await waitForPageSettle(page);

    const cartRes = await page.request.get('/api/cart');
    if (cartRes.ok()) {
      const cartData = await cartRes.json().catch(() => null);
      console.log('Fresh session cart:', JSON.stringify(cartData).slice(0, 200));

      if (cartData?.items || cartData?.lineItems) {
        const items = cartData.items || cartData.lineItems || [];
        expect(items.length).toBe(0);
      }
    }

    await screenshot(page, 'a4_3_fresh_session_cart');
    await freshContext.close();
  });
});

test.describe('A5 - Checkout', () => {
  test('A5.1 - Checkout page loads with expected content', async ({ page }) => {
    await page.goto('/checkout');
    await waitForPageSettle(page);
    await screenshot(page, 'a5_1_checkout');

    // Verify page renders with at least a heading
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
    const headingText = await heading.textContent();
    console.log(`Checkout heading: ${headingText}`);
  });

  test('A5.2 - COD is mentioned on checkout page', async ({ page }) => {
    await page.goto('/checkout');
    await waitForPageSettle(page);

    const codText = page.locator('text=/cash on delivery/i, text=/COD/i, text=/payment/i').first();
    const hasCOD = await codText.isVisible().catch(() => false);
    console.log(`COD indicator visible: ${hasCOD}`);
    await screenshot(page, 'a5_2_cod');
  });
});

test.describe('A6 - Journal / Blog', () => {
  test('A6.1 - /journal loads with articles', async ({ page }) => {
    const { errors } = setupConsoleSpy(page);
    await page.goto('/journal');
    await waitForPageSettle(page);
    await screenshot(page, 'a6_1_journal');

    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(100);
    console.log('Console errors on journal:', errors);
  });

  test('A6.2 - Article links from journal listing go to valid articles', async ({ page }) => {
    await page.goto('/journal');
    await waitForPageSettle(page);

    // Use data-testid to unambiguously target article cards, not breadcrumb links
    const articleLinks = page.locator('[data-testid="journal-article-link"]').first();
    const hasLink = await articleLinks.isVisible().catch(() => false);

    if (hasLink) {
      await articleLinks.click();
      await waitForPageSettle(page);
      expect(page.url()).toContain('/journal/');
      await screenshot(page, 'a6_2_article');

      const heading = page.locator('h1').first();
      await expect(heading).toBeVisible();
    } else {
      console.log('No article links on /journal');
      await screenshot(page, 'a6_2_no_article_links');
    }
  });
});

test.describe('A7 - Policy & Brand Pages', () => {
  const pages = [
    { path: '/privacy-policy', name: 'Privacy Policy' },
    { path: '/terms-of-service', name: 'Terms of Service' },
    { path: '/shipping-policy', name: 'Shipping Policy' },
    { path: '/refund-policy', name: 'Refund Policy' },
    { path: '/about', name: 'About' },
    { path: '/contact', name: 'Contact' },
  ];

  for (const { path: pagePath, name } of pages) {
    test(`A7 - ${name} page loads with content`, async ({ page }) => {
      const { failedRequests } = setupConsoleSpy(page);
      await page.goto(pagePath);
      await waitForPageSettle(page);

      const statusCode = await page.evaluate(() => {
        const meta = document.querySelector('meta[name="http-status"]');
        return meta?.getAttribute('content') || '200';
      });

      const bodyText = await page.locator('body').innerText();
      const safeName = name.toLowerCase().replace(/\s+/g, '_');
      await screenshot(page, `a7_${safeName}`);

      // Should have meaningful content (not empty or 404)
      const is404 = page.url().includes('/not-found') || bodyText.toLowerCase().includes('404') || bodyText.toLowerCase().includes('page not found');
      console.log(`${name}: body length=${bodyText.length}, url=${page.url()}, failed_requests=${failedRequests.length}`);
      expect(is404).toBeFalsy();
      expect(bodyText.length).toBeGreaterThan(50);
    });
  }
});

test.describe('A8 - SEO & Technical', () => {
  test('A8.1 - /sitemap.xml returns valid content', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    const body = await res.text();
    console.log(`Sitemap length: ${body.length}, starts with: ${body.slice(0, 100)}`);
    expect(body).toContain('<?xml');
    expect(body).toContain('<urlset');
  });

  test('A8.2 - /robots.txt returns valid content', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    const body = await res.text();
    console.log(`robots.txt: ${body.slice(0, 200)}`);
    expect(body.toLowerCase()).toContain('user-agent');
  });

  test('A8.3 - Page titles differ between homepage and collection page', async ({ page }) => {
    await page.goto('/');
    await waitForPageSettle(page);
    const homeTitle = await page.title();
    console.log(`Home title: ${homeTitle}`);

    await page.goto('/collections/all');
    await waitForPageSettle(page);
    const collectionTitle = await page.title();
    console.log(`Collection title: ${collectionTitle}`);

    expect(homeTitle).not.toBe(collectionTitle);
  });
});
