# FinTrack - Personal Finance App

A private, mobile-first personal finance tracking app built with Angular, installable as a PWA on your phone, and designed for easy migration from localStorage to a real database.

## Features

- **PIN Lock** - Secure your app with a 6-digit PIN
- **Transactions** - Add income and expenses with categories
- **Dashboard** - Balance, income, expenses, recent transactions, and net worth
- **Budgets** - Monthly budgets with spending tracking and progress bars
- **Investments** - Portfolio tracker with dividend income estimates and allocation chart
- **Money Quest** - Game-like weekly spending challenge with rolling caps, XP, streaks, and end-of-month results
- **Accounts** - Track bank accounts, cash, credit cards
- **Export / Import** - Download and restore a JSON backup of all data
- **Dark theme** - Mobile-first responsive design
- **PWA** - Install on your phone, works offline
- **Docker** - Easy self-hosting + Cloudflare Tunnel

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 20 |
| UI | Angular Material 3 |
| Charts | ECharts (ngx-echarts) |
| State | Angular Signals + Services |
| Storage | Postgres via REST API (NestJS + TypeORM) |
| Auth | Cloudflare Access JWT (`Cf-Access-Jwt-Assertion`) |
| PWA | Angular Service Worker |
| Deployment | Docker + nginx + Cloudflare Tunnel |

## Project Structure

```
src/app/
├── core/          # Models, repositories, tokens, guards, services
├── shared/        # Reusable pipes/components
├── features/      # Feature modules (lazy-loaded)
│   ├── auth/      # PIN setup/unlock
│   ├── dashboard/ # Overview + net worth
│   ├── transactions/
│   ├── budgets/
│   ├── investments/
│   ├── challenge/ # Money Quest (game-like spending challenge)
│   ├── accounts/
│   └── settings/
└── layout/        # App shell with bottom nav
api/
├── src/
│   ├── auth/          # CfAccessGuard (JWT verification) + decorators
│   ├── users/         # User entity + resolve-on-first-login
│   ├── transactions/  # Entity, DTO, service, controller
│   ├── accounts/
│   ├── budgets/
│   ├── investments/
│   ├── challenge/     # Challenge config (single row per user)
│   └── health/        # Unauthenticated /api/health
```

## Development

The frontend dev server proxies `/api` to `http://localhost:3000` (see `proxy.conf.json`).
Run the backend and a Postgres first, then the frontend:

```bash
# 1. Postgres (via the compose `db` service, exposes localhost:5432)
docker compose up -d db

# 2. Backend (http://localhost:3000)
cd api
npm install
$env:DATABASE_URL="postgres://fintrack:<POSTGRES_PASSWORD>@localhost:5432/fintrack"
npm run start:dev

# 3. Frontend (http://localhost:4200)
cd ..
npm start
```

## Production Build

```bash
npm run build      # outputs to dist/personal-finance-app/browser
cd api && npx nest build   # outputs to api/dist
```

## Deployment with Docker + Cloudflare

### 1. Create a Cloudflare Tunnel

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Zero Trust → Networks → Tunnels
2. Create a new tunnel, choose "Docker" as connector
3. Copy the tunnel token

### 2. Configure

```bash
cp .env.example .env
# Edit .env and set:
#   CLOUDFLARE_TUNNEL_TOKEN - tunnel token
#   POSTGRES_PASSWORD       - choose a strong password for the database
#   CF_TEAM_DOMAIN          - https://<your>.cloudflareaccess.com
#   CF_AUD                  - Cloudflare Access Application AUD tag (see below)
```

### 3. Build and Run

```bash
docker compose up -d --build
```

This starts:
- `db` - Postgres 17 (data in a named volume)
- `api` - NestJS + TypeORM backend (port 3000, internal)
- `app` - nginx serving the Angular app on port 4200 and proxying `/api` → api
- `tunnel` - cloudflared connecting to Cloudflare

### 4. Cloudflare Access (privacy + auth)

Set up an Access policy so only YOUR email can reach the app:
1. Zero Trust → Access → Applications → Add an app
2. Select self-hosted, domain = your tunnel subdomain
3. Policy: Allow access if Email = your-email@email.com

The backend verifies Cloudflare's `Cf-Access-Jwt-Assertion` header on every request
and auto-creates a `users` row the first time your email logs in.

**Find your Application AUD tag:** Zero Trust → Access → Applications → your app →
(tab) **Overview** → **Application Audience (AUD) Tag** (also shown under
Application URL). Paste it into `CF_AUD` in `.env`, then restart:

```bash
docker compose up -d --build
```

### 5. Install on Phone

Visit your app URL in Chrome on your phone → "Add to Home Screen". It installs like a native app.

## Architecture Note: Storage

All data access goes through a `Repository<T>` interface. The app uses `HttpRepository<T>`
(HTTP calls to `/api/*`), which the API persists to Postgres, scoped by the authenticated user.

```typescript
// core/repositories/http.repository.ts
export class HttpRepository<T extends { id: string }> implements Repository<T> {
  getAll(): Observable<T[]> { return this.http.get<T[]>(this.basePath); }
  create(item: T): Observable<T> { return this.http.post<T>(this.basePath, item); }
  update(item: T): Observable<T> { return this.http.post<T>(this.basePath, item); }
  delete(id: string): Observable<void> { return this.http.delete<void>(`${this.basePath}/${id}`); }
}
```

The providers are wired in `app.config.ts`:

```typescript
{ provide: TRANSACTION_REPOSITORY, useFactory: (http) => new HttpRepository('/api/transactions', http), deps: [HttpClient] }
```

The backend uses a single **upsert** `POST` for create/update and persists whatever `id` and
timestamps the frontend sends (scoped to the user). No component or feature service changes
were required beyond the repository swap.

## Investments

The Investments feature lets you track a portfolio and estimate dividend income.

- Add a stock or ETF from a curated list (Quantfury-compatible): AAPL, MSFT, AMZN, GOOGL, META, TSLA, NVDA, V, JNJ, KO, PEP, DIS, NFLX, JPM, BAC, WMT, PG, IBM, INTC, AMD, PYPL, UBER, NKE, TM, BABA, TSM, VALE, SPY, QQQ, VTI, VXUS.
- Estimated income = `dividend per share × shares held` (shown as annual and monthly).

### Live prices & dividends (optional)

To auto-fill live prices and trailing dividend, get a **free** [Alpha Vantage API key](https://www.alphavantage.co/support/#api-key) and paste it in **Settings → Market Data**. Without a key you can still enter price and dividend manually.

- `GLOBAL_QUOTE` provides the current price.
- `TIME_SERIES_MONTHLY_ADJUSTED` monthly `dividend amount` values are summed over the last 12 months for the trailing annual dividend.

Free tier is ~25 requests/day, so refresh sparingly.

## Money Quest (Spending Challenge)

A game-like way to discipline weekly spending. Set your **monthly income** and a **weekly maximum outcome**, and each week is tracked against a rolling cap.

- A month splits into buckets: days 1–7 (W1), 8–14 (W2), 15–21 (W3), 22–28 (W4), and 29–end (the "extra days").
- **Rolling caps** (the intelligence): start each week at your base cap, then add/subtract the prior week's result. Spend 110 on a 100 cap → next week's cap drops to 90. Save 20 → next week gets a 20 bonus.
- Spending is **auto-read from your expense transactions**, so there's no double-entry.
- **Gamified feedback**: confetti + green/gold gauges and glow when you're saving, a red shake + heart loss when you blow a week, an XP/level system (Rookie → Legend), a streak flame, and a dramatic end-of-month **"You Saved / Money Lost"** result screen.
- Charts: radial per-week gauges, a week-by-week spent-vs-cap bar chart, and a cumulative saved/lost line.

Reach it from the **Challenge** bottom-nav slot. Settings moved to a gear icon on the Home screen.

## Data Storage

**Synced to the cloud (Postgres, per user):** transactions, accounts, budgets, investments,
and Money Quest config — via the REST API.

**Stored only on the device (localStorage, not synced):**
- `fintrack_pin` - PIN config
- `fintrack_apikey` - Alpha Vantage API key
- `fintrack_authenticated` - session flag

Use Settings → Export Data to download a JSON backup, and Settings → Import Data to restore it.
