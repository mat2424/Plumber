# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Perfect Plumbing App - A plumbing business management application built with React, TypeScript, Vite, shadcn/ui, Tailwind CSS, and Supabase. The app helps manage customers, jobs, scheduling, quotes/invoices, and payments.

## Development Commands

```bash
# Install dependencies
npm i

# Start development server
npm run dev

# Run tests (single run)
npm run test

# Run tests in watch mode
npm run test:watch

# Lint the codebase
npm run lint

# Build for production
npm run build

# Build for development (useful for debugging)
npm run build:dev

# Preview production build locally
npm run preview
```

## Architecture Overview

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Data Fetching**: TanStack Query (React Query)
- **Backend**: Supabase (PostgreSQL + Auth)
- **Testing**: Vitest + Testing Library

### Core Data Model

The application manages five main entities with the following relationships:

1. **Customers** - Basic customer information (name, phone, email, address)
2. **Jobs** - Work orders linked to customers with status tracking
3. **Documents** - Quotes and invoices associated with jobs
4. **Line Items** - Individual items on quotes/invoices
5. **Payments** - Payment records for jobs

**Job Status Flow**:
`draft` → `quoted` → `confirmed` → `in_progress` → `complete` → `invoiced` → `archived`

### Directory Structure

- `src/pages/` - Main application pages (Dashboard, Jobs, Customers, Calendar, Settings, JobDetail)
- `src/components/` - Custom components (AppLayout, BottomNav, JobStatusBadge, NavLink)
- `src/components/ui/` - shadcn/ui component library (50+ reusable components)
- `src/lib/api.ts` - **All data fetching logic** - custom hooks wrapping Supabase queries
- `src/integrations/supabase/` - Supabase client and auto-generated TypeScript types
- `src/hooks/` - Custom React hooks (use-mobile, use-toast)
- `src/test/` - Test setup and utilities

### Key Architectural Patterns

**Data Fetching Layer** (`src/lib/api.ts`):
- All Supabase queries are wrapped in custom hooks using TanStack Query
- Pattern: `useX()` for queries, `useCreateX()`, `useUpdateX()`, `useDeleteX()` for mutations
- All mutations automatically invalidate relevant queries for cache consistency
- Type definitions are co-located with hooks for easy discovery

**Layout System**:
- `AppLayout` provides the shell with responsive navigation (mobile bottom nav + desktop sidebar)
- Uses React Router's `<Outlet />` to render page content
- Navigation items defined once in `navItems` array, shared between mobile and desktop

**Component Patterns**:
- shadcn/ui components are copied into the project and can be modified
- Use `@/` path alias for all imports (resolves to `src/`)
- Form validation with `react-hook-form` + `zod` + `@hookform/resolvers`
- Toast notifications via `sonner` (imported from `@/components/ui/sonner`)

### Environment Variables

Required in `.env`:
```
VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
```

### Supabase Integration

The `src/integrations/supabase/types.ts` file is auto-generated from the Supabase schema. When the database schema changes:
1. Types should be regenerated from Supabase CLI or dashboard
2. Update corresponding TypeScript types in `src/lib/api.ts` if they differ from the database types

### Testing

- Test files: `src/**/*.{test,spec}.{ts,tsx}`
- Setup file: `src/test/setup.ts` (configures jsdom and matchMedia mock)
- Uses Vitest with React Testing Library
- Run single test file: `npm run test <path-to-test-file>`

## Important Notes

- This project uses **bun.lockb** (Bun) alongside npm for package management
- The app was initially created via Lovable.dev (a visual development platform)
- UI components from shadcn/ui should be modified directly in `src/components/ui/` rather than being treated as a library
- When adding new pages, update the routes in `src/App.tsx` and add navigation items to `AppLayout.tsx` if needed
