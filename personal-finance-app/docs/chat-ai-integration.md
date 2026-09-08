# FinTrack API — Integration Spec for an External AI Assistant

This document specifies how to call the FinTrack REST API from an external client (e.g. a local AI assistant) and how the authentication system works. It reflects the implementation as of the current codebase.

---

## 1. Base URL

All API routes are prefixed with `/api`. External clients should use the **public Cloudflare Tunnel hostname** so that Cloudflare Access can inject its JWT:

```
https://<your-tunnel-hostname>/api/...
```

Local (same machine, no Cloudflare JWT injection):

```
http://localhost:4200/api/...
```

> Everything except `GET /api/health` requires authentication.

---

## 2. Authentication

There are two layers, but only one is relevant to API calls.

### Layer A — Cloudflare Access (API auth, mandatory)

The API runs a global guard (`CfAccessGuard`, registered app-wide in `api/src/app.module.ts`). Every protected endpoint requires a valid Cloudflare Access JWT in this HTTP header:

```
Cf-Access-Jwt-Assertion: <jwt>
```

How it works:

- The header name is `Cf-Access-Jwt-Assertion`. nginx already forwards it upstream (`nginx.conf`: `proxy_set_header Cf-Access-Jwt-Assertion $http_cf_access_jwt_assertion;`).
- The JWT is validated as RS256 via the JWKS set fetched from `https://<CF_TEAM_DOMAIN>/cdn-cgi/access/certs`, requiring:
  - `iss` (issuer) = `<CF_TEAM_DOMAIN>`
  - `aud` (audience) = `<CF_AUD>`
  - Both are set via `.env` → `docker-compose.yml` (`CF_TEAM_DOMAIN`, `CF_AUD`).
- Identity mapping (`api/src/users/users.service.ts`):
  - The token's `email` claim is used (fallback: `identity`, then `sub`).
  - `resolveByEmail(email)` finds the user by email; if no row exists, **a new, empty user is auto-created**.
  - All reads/writes are scoped to that resolved user's `userId`.

**Options to authenticate an external assistant:**

**A1. Browser-token pass-through (works today, no code changes).**
Expose the JWT that your logged-in browser session already holds (e.g. from the `CF_Authorization` cookie) and send it as `Cf-Access-Jwt-Assertion`. This is bound to the browser session's token lifecycle and is fragile for a long-running assistant.

**A2. Cloudflare Service Token.**
Create a Service Token in Cloudflare Zero Trust (Access → Service Auth), then send:

```
CF-Access-Client-Id: <client-id>
CF-Access-Client-Secret: <client-secret>
```

Cloudflare validates it at the edge and injects the `Cf-Access-Jwt-Assertion` header before the request reaches nginx.

> ⚠ **Critical caveat:** a Service Token authenticates as `<token-name>@service.cloudflareaccess.com`. Because the API maps identity by email and auto-creates users, an assistant using a Service Token would resolve to a **separate, empty user** — not your data. Using this option requires a server-side identity-mapping tweak (or the option below).

**A3. Personal API key (recommended, not yet implemented).**
Add a per-user API token (stored on the `users` table) with a guard that also accepts `Authorization: Bearer <key>` and resolves to your real `userId`. This removes the Cloudflare identity-mapping dependency entirely. **Not implemented in the current code** — this spec documents the current state.

### Layer B — PIN (client-side only, irrelevant to the API)

The PIN is purely a local UI unlock:

- Stored in `localStorage['fintrack_pin']` as `{ hash, createdAt }` (djb2-style hash, not a secure KDF).
- Unlock flag in `sessionStorage['fintrack_authenticated']`.
- It gates Angular routes only. **API calls never see the PIN.**

---

## 3. Endpoints

JSON only. Methods and meanings:

- `GET /<resource>` — list all items for the authenticated user.
- `POST /<resource>` — **upsert** by client-generated UUID `id`: same `id` = update, new `id` = insert. The frontend uses POST for both create and update.
- `DELETE /<resource>/:id` — remove.
- The API strips unknown fields (NestJS `ValidationPipe` with `whitelist: true`).

| Method | Path                    | Auth | Notes                                          |
| ------ | ----------------------- | ---- | ---------------------------------------------- |
| GET    | `/api/health`           | ✗    | `{ "status": "ok", "timestamp": ... }`         |
| GET    | `/api/transactions`     | ✓    | newest first                                   |
| POST   | `/api/transactions`     | ✓    | upsert full entity                             |
| DELETE | `/api/transactions/:id` | ✓    | `{ "success": true }`                          |
| GET    | `/api/accounts`         | ✓    | balances are **derived**; never send `balance` |
| POST   | `/api/accounts`         | ✓    | upsert (sent `balance` is ignored)             |
| DELETE | `/api/accounts/:id`     | ✓    |                                                |
| GET    | `/api/budgets`          | ✓    |                                                |
| POST   | `/api/budgets`          | ✓    | upsert                                         |
| DELETE | `/api/budgets/:id`      | ✓    |                                                |
| GET    | `/api/investments`      | ✓    |                                                |
| POST   | `/api/investments`      | ✓    | upsert                                         |
| DELETE | `/api/investments/:id`  | ✓    |                                                |
| GET    | `/api/challenge-config` | ✓    | returns defaults if unset (see shape)          |
| PUT    | `/api/challenge-config` | ✓    | upsert config                                  |

Error responses: `401` missing/invalid token; `400` validation failure; `404` delete target missing.

---

## 4. Data Shapes

### Transaction

`type` is `'income' | 'expense' | 'transfer'`.

```json
{
  "id": "<uuid: client-generated>",
  "type": "transfer",
  "amount": 50.0,
  "category": "transfer",
  "description": "Month-end savings",
  "date": "2026-09-30",
  "accountId": "<uuid: destination account>",
  "sourceAccountId": "<uuid: source account>"
}
```

Rules:

- **income / expense:** `accountId` identifies the account. `category` must be one of the category values listed below.
- **transfer:** `category` is fixed to `"transfer"`, `accountId` = destination account, `sourceAccountId` = source account, and `sourceAccountId` **must not equal** `accountId`. Balances derive automatically: destination balance `+amount`, source balance `−amount`. Transfers **never** count as income or spending in stats (budgets, Money Quest, spending-by-category, month totals).
- `date` is a `YYYY-MM-DD` string in local time.
- `amount` is a number.

Category values (`category`):

- Income: `salary`, `freelance`, `investment_income`, `gifts_received`, `other`
- Expense: `food_dining`, `groceries`, `transport`, `fuel`, `bills_utilities`, `rent_mortgage`, `insurance`, `entertainment`, `subscriptions`, `shopping`, `health`, `education`, `personal_care`, `investments`, `gifts_sent`, `other`
- Transfer: `transfer`

### Account

```json
{
  "id": "<uuid: client-generated>",
  "name": "Savings",
  "type": "savings",
  "balance": 500.25,
  "currency": "USD",
  "color": "#ff6e6e",
  "icon": "account_balance_wallet"
}
```

Rules:

- `type` ∈ `checking | savings | cash | credit_card | other`.
- `balance` is **always derived server-side** as the net of that account's transactions (`income − expense − transfers-out + transfers-in`). Requests should omit it; any sent value is ignored.
- Optional: `currency` (default `USD`), `color` (default `#ff6e6e`), `icon` (default `account_balance_wallet`).

### Budget

```json
{
  "id": "<uuid: client-generated>",
  "category": "groceries",
  "amount": 200,
  "month": 9,
  "year": 2026
}
```

### Investment

```json
{
  "id": "<uuid: client-generated>",
  "name": "AAPL",
  "type": "stock",
  "symbol": "AAPL",
  "shares": 5,
  "purchasePrice": 150,
  "currentPrice": 180,
  "dividendPerShare": 0.5
}
```

Rules:

- `type` ∈ `stock | crypto | bond | savings_account | real_estate | other`.
- Optional: `symbol`, `shares`, `dividendPerShare`, `lastUpdated`.

### Challenge config

```json
{
  "monthlyIncome": 2500,
  "weeklyMax": 400,
  "enabled": true
}
```

`GET` returns this shape, or the defaults `{ "monthlyIncome": 0, "weeklyMax": 0, "enabled": false }` when nothing is configured.

---

## 5. General Conventions

- **IDs:** always a client-generated UUID (`uuid v4` in the frontend). The API trusts client IDs for upserts.
- **Response envelopes:** list endpoints return plain JSON arrays; deletes return `{ "success": true }`.
- **Current user (reference):** `gabrieltc555@gmail.com`, `userId 20d4bd1f-5e0e-4f84-a09e-146b4719ce8d`.

---

## 6. CORS

`CORS_ORIGIN` (from `.env`) is a comma-separated allowlist checked by the API.

- Browser-based clients (e.g. an assistant UI running on a dev server) must have their origin in that list.
- Non-browser clients (Node process, desktop app, curl) are unaffected by CORS.

---

## 7. Quick Start (curl examples)

Health check (no auth):

```bash
curl https://<your-tunnel-hostname>/api/health
```

List your transactions with a browser-session JWT (pass-through mode):

```bash
curl -H "Cf-Access-Jwt-Assertion: <jwt>" \
  https://<your-tunnel-hostname>/api/transactions
```

Create a transfer between two accounts (upsert):

```bash
curl -X POST https://<your-tunnel-hostname>/api/transactions \
  -H "Cf-Access-Jwt-Assertion: <jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "<uuid>",
    "type": "transfer",
    "amount": 50,
    "category": "transfer",
    "description": "Month-end savings",
    "date": "2026-09-30",
    "accountId": "<destination-account-uuid>",
    "sourceAccountId": "<source-account-uuid>"
  }'
```
