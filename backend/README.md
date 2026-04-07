# PartnerLedger OS Backend

Backend foundation for PartnerLedger OS using NestJS, Prisma, PostgreSQL (Supabase), and Socket.IO.

## Current Scope

This step establishes:

- NestJS application bootstrap
- Clean architecture folder layout
- Prisma schema for the core finance domain
- Config validation for Supabase and JWT settings
- Event bus and engine skeletons
- WebSocket gateway foundation for live updates
- Working auth module with JWT and refresh token rotation
- Working partner module with ownership validation and wallet initialization
- Working sales module with validated revenue capture and `sale.created` events
- Working expenses module with validated spend capture and `expense.created` events
- Working engine layer for wallet updates, live settlements, insights, alerts, and websocket broadcasts
- Working read APIs for dashboard aggregation and settlement suggestions

## Quick Start

1. Copy `.env.example` to `.env`.
2. Replace the Supabase connection strings and JWT secrets.
3. Install dependencies:

```bash
npm install
```

4. Generate the Prisma client:

```bash
npm run prisma:generate
```

5. Run the backend in development mode:

```bash
npm run start:dev
```

## Folder Guide

- `src/modules`: feature modules such as auth, sales, expense, settlement, and dashboard
- `src/core/engines`: domain logic engines for wallet, settlements, insights, and alerts
- `src/core/events`: event names and the event bus abstraction
- `src/gateway`: Socket.IO gateway and event-to-websocket bridge
- `src/prisma`: Prisma service and module
- `prisma/schema.prisma`: database models and indexes
- `docs/architecture.md`: backend design notes

## Implemented API Routes

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/partners`
- `GET /api/v1/partners`
- `POST /api/v1/sales`
- `GET /api/v1/sales`
- `POST /api/v1/expenses`
- `GET /api/v1/expenses`
- `GET /api/v1/dashboard`
- `GET /api/v1/settlements`

## Partner Rules

- Only `ADMIN` users can create partners.
- Partner creation automatically provisions a wallet with zero balances.
- Total ownership across partners cannot exceed `100%`.

## Sales Rules

- Only `ADMIN` and `PARTNER` users can create sales.
- Sales validate the receiving partner before persistence.
- Sales do not update wallets directly; they emit `sale.created` for downstream engines.

## Expense Rules

- Only `ADMIN` and `PARTNER` users can create expenses.
- Expenses validate the paying partner before persistence.
- Expenses do not update wallets directly; they emit `expense.created` for downstream engines.

## Engine Flow

- `sale.created` and `expense.created` trigger the `WalletEngine`.
- `WalletEngine` updates balances atomically and emits `wallet.updated`.
- `SettlementEngine` recalculates the live settlement batch from the latest wallet state.
- `InsightEngine` stores lightweight business signals such as expense spikes and profit drops.
- `AlertEngine` stores operational alerts such as loss days, overspending, no-sales days, and imbalance warnings.
- Websocket broadcasts publish `transaction.created`, `dashboard.update`, `settlement.updated`, `insight.generated`, and `alert.triggered`.

## Read APIs

- `GET /api/v1/dashboard` returns totals, partner balances, and recent sales/expenses.
- `GET /api/v1/settlements` returns the current live settlement suggestions as `from -> to -> amount`.
- Both routes require JWT authentication and allow `ADMIN` and `PARTNER`.

## Supabase Notes

- Use the pooled connection string in `DATABASE_URL` for the running API.
- Use the direct connection string in `DIRECT_URL` for Prisma migrations.
- The schema already targets PostgreSQL and uses Prisma relations and indexes suitable for Supabase-hosted Postgres.
