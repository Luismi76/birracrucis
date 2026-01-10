# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Birracrucis is a Spanish-language app for organizing bar crawls ("rutas de cervezas") among friends. Users create routes with multiple bars, track rounds/drinks at each stop, and use geolocation for auto check-in when arriving at bars.

## Commands

```bash
# Development
npm run dev          # Start dev server (port 3000)
npm run build        # Build for production (includes prisma generate)
npm run lint         # Run ESLint
npm run test         # Run Vitest tests
npx vitest run path/to/file.test.ts  # Run single test file

# Database
npx prisma db push   # Push schema changes to database
npx prisma generate  # Generate Prisma client
npx prisma studio    # Open database GUI
npx prisma migrate dev  # Create and apply migrations

# Testing geolocation on mobile (requires HTTPS)
npx ngrok http 3000  # Creates HTTPS tunnel for mobile testing

# Utility scripts
npx tsx check-coordinates.ts    # Verify coordinates in database
npx tsx calculate-distance.ts   # Calculate distances between points
```

## Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js with Google provider (JWT strategy)
- **Maps**: Google Maps API (@react-google-maps/api)
- **Styling**: Tailwind CSS 4 + Radix UI + shadcn/ui
- **PWA**: next-pwa for service worker

### Key Directories
- `app/` - Next.js App Router pages and API routes
- `components/` - React components (all "use client")
- `lib/` - Shared utilities (prisma.ts, auth.ts, utils.ts)
- `prisma/schema.prisma` - Database schema

### Core Data Models
- **Route** - A bar crawl with name, date, status, and settings (pot system, time config)
- **RouteStop** - A bar in a route with coordinates, planned/actual rounds
- **Participant** - User joined to a route with real-time location tracking
- **User** - NextAuth user with settings (autoCheckinEnabled, notificationsEnabled)

### Important Patterns

**User ID Handling**: NextAuth session.user.id contains the Google provider ID, NOT the internal database ID. When working with user-specific data, always fetch the internal ID first:
```typescript
const currentUser = await prisma.user.findUnique({
  where: { email: session.user.email },
  select: { id: true },
});
```

**Guest User Support**: Many models (Participant, Drink, Photo, Message) support both `userId` and `guestId` fields. Guests can participate in routes without an account using a client-generated guestId.

**Geolocation**: Uses Haversine formula for distance calculations (`hooks/useGeolocation.ts`). Auto check-in radius is 50m, manual check-in radius is 75m. Constants defined in `GEOLOCATION_CONSTANTS`. Geolocation requires HTTPS on mobile.

**API Route Pattern**: All API routes use `{ params }: { params: Promise<{ id: string }> }` pattern (Next.js 15 async params).

**Rate Limiting**: API routes use custom rate limiting via `lib/rate-limit.ts`. Use `rateLimit()` and `getClientIdentifier()` for protected endpoints. Predefined configs: `frequent` (30/10s), `standard` (60/min), `write` (20/min), `strict` (10/min).

**Real-time Updates**: Uses Pusher for real-time features (participant locations, chat messages, round updates). Server client in `lib/pusher.ts` uses singleton pattern to avoid multiple connections in development.

**Auth Helpers**: Use `lib/auth-helpers.ts` for consistent auth handling:
- `getCurrentUser(req)` - Returns authenticated user OR guest (check `user.type`)
- `getAuthenticatedUser(req)` - Returns only authenticated users (rejects guests)
- `getUserIds(user)` - Extracts `{ userId }` or `{ guestId }` for database queries

### Main Components
- `RouteEditor.tsx` - Create/edit routes with bar search and map
- `RouteDetailClient.tsx` - Main route view during a bar crawl (rounds, map, drinks)
- `BarSearchMap.tsx` - Google Maps integration for bar selection
- `PotManager.tsx` - Shared money pot for group expenses

## Language

The app UI and user-facing content is in **Spanish**. Code comments and variable names are mixed Spanish/English.

## Environment Variables

See `.env.example` for full documentation. Core required variables:

```
# Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...

# Google OAuth & Maps
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_MAPS_API_KEY=...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...

# Pusher (real-time features)
PUSHER_APP_ID=...
PUSHER_SECRET=...
NEXT_PUBLIC_PUSHER_KEY=...
NEXT_PUBLIC_PUSHER_CLUSTER=...
```

Optional: VAPID keys (push notifications), RESEND_API_KEY (emails), MINIO_* (photo storage).
