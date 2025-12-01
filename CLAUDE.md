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

**Geolocation**: Uses Haversine formula for distance calculations. Auto check-in radius is 50m, proximity detection is 75m. Geolocation requires HTTPS on mobile.

**API Route Pattern**: All API routes use `{ params }: { params: Promise<{ id: string }> }` pattern (Next.js 15 async params).

### Main Components
- `RouteEditor.tsx` - Create/edit routes with bar search and map
- `RouteDetailClient.tsx` - Main route view during a bar crawl (rounds, map, drinks)
- `BarSearchMap.tsx` - Google Maps integration for bar selection
- `PotManager.tsx` - Shared money pot for group expenses

## Language

The app UI and user-facing content is in **Spanish**. Code comments and variable names are mixed Spanish/English.

## Environment Variables

Required in `.env.local`:
```
DATABASE_URL=postgresql://...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_MAPS_API_KEY=...
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
```
