# Product Barcode Generator

Production-grade POS barcode and serial tracking generator built with Next.js App Router.

## Overview

This application provides:

- Strictly validated barcode generation (`timestamp` and `range` modes)
- Configurable barcode rendering (`format`, `scale`, `height`)
- Fast preview rendering through an API route using `bwip-js`
- Print workflow with row/column controls, quality presets, and browser-native PDF/print
- PWA install support and offline fallback page
- Token-based theming for light/dark compatibility

## Tech Stack

- Next.js `16.1.6` (App Router)
- React `19`
- TypeScript (strict mode)
- shadcn/ui components
- `bwip-js` for barcode image generation
- `next-themes` for theme switching

## Core Features

### 1. Generation Configuration

- Company name (optional)
- Prefix (optional)
- Barcode format (`code128`, `code39`, `ean13`)
- Generation mode:
  - `timestamp`: `Date.now()` + increment with quantity
  - `range`: start/end number generation
- Size controls:
  - `scale` (bounded)
  - `height` (bounded)
- Input validation with field-level errors

### 2. Barcode Logic (Domain Layer)

- `lib/config.ts`: domain types, constants, and validation
- `lib/generator.ts`: pure barcode generation orchestration
- Supports extension points for:
  - checksum strategy
  - uniqueness validator (future DB-backed uniqueness checks)

### 3. Barcode Rendering API

- Route: `GET|POST /api/barcode`
- Generates PNG buffers using `bwip-js`
- Supports custom:
  - `text`
  - `format`
  - `scale`
  - `height`
  - `includeText`

### 4. Print Pipeline

- Print opens in dedicated route: `/print?job=<key>`
- Job payload stored in localStorage for tab handoff
- Print page supports:
  - rows per page
  - columns per page
  - quality preset (`standard`, `high`, `ultra`)
- Layout chunks barcodes into pages (`rows × columns`)
- Browser-native printing enables direct printer output or Save as PDF

### 5. PWA

- Manifest route: `/manifest.webmanifest`
- Service worker: `public/sw.js`
- Offline fallback route: `/offline`
- Install button shown when `beforeinstallprompt` is available

## Project Structure

```text
app/
  api/barcode/route.ts
  manifest.ts
  offline/page.tsx
  print/page.tsx
  layout.tsx
  page.tsx
  globals.css
components/
  barcode/
    barcode-config-form.tsx
    barcode-generator-app.tsx
    barcode-preview-grid.tsx
    print-page-client.tsx
  ui/...
  pwa-install-button.tsx
  pwa-register.tsx
  theme-provider.tsx
  theme-toggle.tsx
hooks/
  use-barcode-previews.ts
lib/
  config.ts
  generator.ts
  print.ts
public/
  sw.js
```

## Getting Started

Install dependencies:

```bash
npm install
```

Run dev server:

```bash
npm run dev
```

Open:

- `http://localhost:3000`

## Production Run

```bash
npm run build
npm run start
```

For PWA/service worker behavior, test in production mode.

## Scripts

- `npm run dev` - start development server
- `npm run build` - build production app
- `npm run start` - run production build
- `npm run lint` - run ESLint

## Theming Rules

The app is implemented with theme-token conventions and avoids hardcoded utility colors in UI code.  
Examples: `bg-background`, `text-foreground`, `border-border`, `bg-card`, `text-muted-foreground`.

## Current Readiness

- Multi-company capable (company name/prefix handling)
- Multi-tenant-ready domain model (`tenantId`, `companyId` placeholders)
- Print and PDF workflow operational
- PWA install and offline fallback available
- Ready for DB integration in uniqueness and persistence layers
