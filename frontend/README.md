# PartnerLedger OS Frontend

Next.js frontend for PartnerLedger OS. This app connects to the NestJS backend and provides login, dashboard analytics, transaction entry, settlement visibility, and realtime updates through Socket.IO.

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Recharts
- Socket.IO client

## Routes

- `/login`
- `/dashboard`
- `/sales`
- `/expenses`
- `/settlements`

## Environment Setup

Copy `.env.example` to `.env.local` and update the backend URLs:

```bash
cp .env.example .env.local
```

Required variables:

- `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1`
- `NEXT_PUBLIC_WS_URL=http://localhost:4000/realtime`

## Run Locally

```bash
npm install
npm run dev
```

Frontend runs on [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
```

## Authentication Flow

- Users log in from `/login`
- Access and refresh tokens are stored in `localStorage`
- Protected pages redirect to `/login` when no session is present
- API requests attach the JWT automatically

## Realtime Behavior

The client listens for backend events and refreshes cached queries automatically:

- `dashboard.update`
- `settlement.updated`
- `alert.triggered`

## Key Files

- `lib/api.ts` for backend communication
- `lib/auth.ts` for browser session storage
- `components/providers/app-providers.tsx` for TanStack Query and toasts
- `components/providers/realtime-sync.tsx` for Socket.IO syncing
- `components/layout/app-shell.tsx` for shared authenticated layout

## Notes

- The UI assumes the backend is already running with the PartnerLedger APIs available.
- Current auth persistence is browser-based and suitable for the requested demo flow; cookie-based auth can be added later if needed.
