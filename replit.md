# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### Diet Plan Manager (`artifacts/diet-tracker`)
- **Type**: Expo mobile app
- **Preview path**: `/`
- **Purpose**: 30-day diet plan tracking app
- **Features**:
  - JWT-based login (demo credentials stored locally via AsyncStorage)
  - Dashboard with today's plan, day streak, completion %
  - Day detail screen with meals (breakfast/lunch/dinner) + exercises
  - Mark items complete with checkboxes
  - Upload proof photos via camera or gallery (expo-image-picker)
  - Progress tracker showing all 30 days
  - Profile screen with plan details and logout
  - Expiry warning 3-4 days before plan ends
  - SVG progress rings (react-native-svg)
- **Key packages**: @react-native-async-storage/async-storage, expo-image-picker, react-native-svg, expo-haptics
- **Demo users**: user001/diet123, user002/healthy2024, admin001/admin123
