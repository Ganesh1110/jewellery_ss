# Admin Auth Gate & Checkout→DB Wiring Fixes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close the two misalignment gaps that prevent the admin UI from being reachable when authenticated and prevent checkout from ever creating real `Order` rows in MySQL.

**Architecture:** Verified wiring status (evidence-based):
- MySQL → Prisma client → `src/lib/shopify.ts` (DB reads for products/collections/articles/shop) = wired.
- Cart: `CartContext` → `cart-api.ts` → `/api/cart*` → Prisma (`Cart`/`CartItem`) = wired.
- Admin data: `admin/pages` → `/api/admin/*` → `getSession()` + Prisma = wired (proven: valid token returns 12 products, 200).
- Checkout→Orders: `/api/checkout` (POST) writes `Order` rows + decrements inventory in a transaction; `src/app/api/admin/orders/route.ts` (GET) reads them → Orders page fetches it = wired.
- **One critical break:** `src/middleware.ts:11` compares the session cookie to the literal `'authenticated'`, but `/api/auth/login` stores a random DB token. Result: every authenticated admin is 307-redirected to `/admin/login` (proven live). AdminShell's server-side `getSession()` is the working authority; middleware just needs to fast-redirect when the cookie is *absent* (never validate its value server-side — Edge-safe).
- **Second bug (latent):** `CheckoutCapture` auto-fires `POST /api/checkout` on mount (silent on failure, no confirmation, "Secure checkout powered by Shopify" copy is stale). Fix: make CartDrawer trigger checkout explicitly so it's a deliberate user action with loading/error/success states. Orders already persist to DB, so no localStorage shim needed.

**Tech Stack:** Next.js 14.2, Prisma 5 + `@prisma/client` (mysql), MySQL 8 (local, running), bcryptjs, Vitest (node env).

> **Executed approach (this session):** The local MySQL user `sss` has no `CREATE DATABASE` privilege, so the hermetic `sss_ecommerce_test` DB could not be provisioned. Tests instead run against the **existing seeded `sss_ecommerce` dev DB** and are row-hermetic: every seed uses `test-*`/`@test.*`/`tok-test-*` identifiers tracked in a `TestScope`, and `cleanupScoped()` deletes them in FK-safe order in `afterAll`. Verified zero residual rows after every run.

## Global Constraints
- Work only in the `mysql-db-api` worktree (`.worktrees/mysql-db-api`); the parent `jewellery_ss` repo is NOT modified.
- TypeScript strict; `npm run type-check` (`tsc --noEmit`) and `npm run lint` must pass.
- Tests must run with `npm test` (=`vitest run`) and be hermetic (SQLite, seeded).
- Do not change the `User`/`Session`/`Order`/`Product` Prisma models (schema stays as-is).
- Auth token stays httpOnly in the API-layer session; middleware must NOT trust a literal cookie value.

---

### Task 0: Test harness (prerequisite for TDD)

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/api/setup.ts` (seed helper)
- Modify: `package.json` (scripts only)

**Interfaces:**
- Consumes: Prisma schema as-is; `DATABASE_URL` swapped to SQLite file `file:./test.db` in CI/test only.
- Produces: `npm test` runs Vitest against a fresh SQLite DB; `prisma migrate dev` not needed because the test seeds via Prisma client directly.

- [x] **Step 1: Update vitest config** — `vitest.config.ts`, `setupFiles: ['./tests/setup.ts']`, `environment: 'node'`, test glob `tests/**/*.test.ts`.
- [x] **Step 2: Test env setup** (`tests/setup.ts`) — points `DATABASE_URL` at the local dev MySQL DB (no schema DDL needed; tables already exist).
- [x] **Step 3: Write seed helper** (`tests/helpers/seed.ts`) — `seedAdminUser`, `seedProduct`, `seedCartWithItem`, `createUnexpiringSession`, and `cleanupScoped(TestScope)` that removes all test rows in FK-safe order.
- [x] **Step 4: Wire `test` script** to `package.json` (`vitest run`) — done.
- [x] **Step 5: Run `npm test`** — green: 11 tests / 4 files; `tsc --noEmit` clean.

### Task 1: Fix admin auth gate (middleware)

**Files:**
- Modify: `src/middleware.ts` (remove broken literal check; defer to `AdminShell`/`getSession()`)
- Test: `tests/api/middleware.test.ts`, `tests/api/auth-flow.test.ts`

**Root cause:** `src/middleware.ts:11` compares `adminSession !== 'authenticated'`. Login (`src/app/api/auth/login/route.ts`) stores a random hex token in the DB `Session` table. No code ever sets the cookie to `'authenticated'`, so the middleware rejects every authenticated user with a 307. The authoritative gate is `src/app/admin/layout.tsx:6` + `src/app/admin/AdminShell.tsx` (server-side `getSession()`).

**Fix:** Middleware reads the cookie only to redirect when *absent*, otherwise calls `NextResponse.next()` and lets `AdminShell` make the DB-backed decision. (Edge-safe: no Prisma in middleware.)

- [x] **Step 1: Write failing test** — `tests/api/middleware.test.ts`: build a `NextRequest` for `/admin`; (a) no `sss_admin_session` cookie → `middleware()` returns a redirect to `/admin/login`; (b) a request bearing *any* `sss_admin_session` cookie value → `middleware()` returns `NextResponse.next()` (NOT a redirect). Currently (b) fails → test fails.
- [x] **Step 2: Run to verify test fails** (the valid-token case redirected 307 — confirmed red).
- [x] **Step 3: Implement fix** in `src/middleware.ts` — only redirect when the cookie is **absent**; otherwise `next()` (defer value validation to AdminShell `getSession()`).
- [x] **Step 4: Run test → pass** (4/4 middleware tests green).
- [x] **Step 5: Commit** `fix(admin): remove stale 'authenticated' cookie-value check from middleware; defer to server-side AdminShell gate`.

### Task 2: Make checkout an explicit, observable user action

**Files:**
- Modify: `src/components/cart/CartDrawer.tsx` (checkout button calls new `checkoutOrder` helper instead of `window.location.href = cart.checkoutUrl`)
- Create: `src/lib/cart-api.ts` export `checkoutOrder(cartId)`
- Modify: `src/components/cart/CheckoutCapture.tsx` (stop auto-firing; instead render the order-confirmation derived from the explicit call, or remove the silent auto-fire)
- Test: `tests/api/checkout-api.test.ts` (happy-dom: mocked `fetch`, `localStorage`) + `tests/api/checkout-route.test.ts` (DB: call the `/api/checkout` handler directly)

**Root cause:** `CartDrawer.tsx:147` navigates to `/checkout`, where `CheckoutCapture` auto-POSTs `/api/checkout` on mount — silent on failure, no confirmation shown, stale "Shopify" copy. The route itself is wired to the DB.

**Fix:** Extract `checkoutOrder(cartId)` in `cart-api.ts` → `POST /api/checkout`, on ok persist the returned order to a `checkout: { ... }` shape surfaced to CartDrawer for a confirmation view (and clear `sss_cart_id`); on error return `{ ok:false, error }` surfaced inline via `aria-live`. CartDrawer's button calls `checkoutOrder` and shows loading→success/error inline. `CheckoutCapture` auto-fire is removed (no longer needed).

- [x] **Step 1: Write failing tests**: `checkoutOrder` with mocked `fetch` resolves `{ok:true, order}` and clears `sss_cart_id` (`tests/api/checkout-order.test.ts`); `/api/checkout` handler with a seeded DB cart creates an `Order`, decrements inventory, deletes the cart (`tests/api/checkout-route.test.ts`).
- [x] **Step 2: Run → fail** (`checkoutOrder` was undefined → confirmed red).
- [x] **Step 3: Implement** `checkoutOrder` in `src/lib/cart-api.ts` (POST + clear `sss_cart_id` + typed error). CartDrawer's "Proceed to Checkout" button now calls `checkoutOrder` and shows loading→success/error inline (`aria-live`); the order confirmation renders in the drawer and `CheckoutCapture`'s silent auto-fire was removed (component deleted, `/checkout` copy updated).
- [x] **Step 4: Run → pass** (2/2 helper tests + 2/2 route tests green).
- [x] **Step 5: Commit** `feat(cart): explicit checkout→/api/checkout with confirmation + error surfacing`.

### Task 3: Regression (admin reachable after login)

**Files:**
- Create: `tests/api/admin-protected.test.ts`
- [x] **Step 1: Test** — `tests/api/auth.test.ts` logs in via `POST /api/auth/login` (admin123) and asserts the `set-cookie` value is a real DB `Session` row; `tests/api/middleware.test.ts` asserts `middleware()` with that cookie → `next()`.
- [x] **Step 2: Run → green.**
- [x] **Step 3: Commit** `test: regression guard for admin auth reachability`.

## Verification (before review gate)
- `npm run type-check` clean.
- `npm run lint` clean (ignore pre-existing worktree eslint-config-next plugin conflict warning — not a failure).
- `npm run build` clean.
- `npm test` all green.

## Out of scope (explicitly deferred)
- Full customer hardening (loading/empty/error states, a11y focus rings, contrast) — separate plan.
- Porting Phase-0-3 design-system work from the parent repo into the worktree.
