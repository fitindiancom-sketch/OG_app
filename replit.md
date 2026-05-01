# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL (via `pg` Pool directly in api-server, no Drizzle)
- **Auth**: bcryptjs + jsonwebtoken (JWT, 30-day sessions)
- **Validation**: Zod (`zod/v4`)
- **Build**: esbuild (ESM bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `PORT=8080 pnpm --filter @workspace/api-server run dev` — run API server locally (build + start)
- `pnpm --filter @workspace/diet-tracker run dev` — run Expo Metro dev server

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Workflows

- **API Server** — `PORT=8080 pnpm --filter @workspace/api-server run dev` (console, port 8080)
- **Start application** — `pnpm --filter @workspace/diet-tracker run dev` (webview, port 20729)

## Artifacts

### Diet Plan Manager (`artifacts/diet-tracker`)
- **Type**: Expo mobile app (Expo 54, expo-router)
- **Preview path**: `/` (Expo domain routing)
- **Port**: 20729 (Metro dev server)
- **Purpose**: 30-day diet plan tracking app
- **Features**:
  - JWT-based login via PostgreSQL API
  - Dashboard with today's plan, day streak, completion %
  - Day detail screen with meals (breakfast/lunch/dinner) + exercises
  - Mark items complete with checkboxes
  - Upload proof photos via camera or gallery (expo-image-picker)
  - Progress tracker showing all 30 days
  - Profile screen with plan details and logout
  - Expiry warning 3-4 days before plan ends
  - SVG progress rings (react-native-svg)
- **Key packages**: @react-native-async-storage/async-storage, expo-image-picker, react-native-svg, expo-haptics
- **Demo credentials**: demo@diet.app / demo123
- **API URL**: Uses `EXPO_PUBLIC_DOMAIN=$REPLIT_DEV_DOMAIN` → `https://<domain>/api` (Replit artifact router proxies /api to port 8080)

### API Server (`artifacts/api-server`)
- **Type**: Express 5 API
- **Preview path**: `/api`
- **Port**: 8080
- **Database**: Replit PostgreSQL (via DATABASE_URL secret)
- **Auth**: bcryptjs + JWT
- **Photo storage**: Local disk (`artifacts/api-server/uploads/`), served as static files
- **DB Tables**: clients, photos, photo_comments, water_logs, progress_logs, device_tokens
- **Key env vars**: DATABASE_URL, SESSION_SECRET, PORT=8080
