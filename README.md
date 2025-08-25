<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/9113740/201498864-2a900c64-d88f-4ed4-b5cf-770bcb57e1f5.png">
  <source media="(prefers-color-scheme: light)" srcset="https://user-images.githubusercontent.com/9113740/201498152-b171abb8-9225-487a-821c-6ff49ee48579.png">
</picture>

<div align="center"><strong>Next.js Admin Dashboard Starter Template With Shadcn-ui</strong></div>
<div align="center">Built with the Next.js 15 App Router</div>
<br />
<div align="center">
<a href="https://dub.sh/shadcn-dashboard">View Demo</a>
<span>
</div>

## Overview

UmrahCheck CRM Dashboard - Enterprise-level Customer Relationship Management system for Umrah travel agencies with AI-powered lead scoring and natural language query interface.

## Tech Stack

- Framework - [Next.js 15](https://nextjs.org/13) with App Router
- Language - [TypeScript](https://www.typescriptlang.org) (strict mode)
- Auth - [Clerk](https://go.clerk.com/ILdYhn7) with RBAC
- Database - [Supabase](https://supabase.com) (PostgreSQL)
- Styling - [Tailwind CSS v4](https://tailwindcss.com)
- Components - [Shadcn-ui](https://ui.shadcn.com)
- Schema Validations - [Zod](https://zod.dev)
- State Management - [Zustand](https://zustand-demo.pmnd.rs)
- Search params - [Nuqs](https://nuqs.47ng.com/)
- Tables - [Tanstack Data Tables](https://ui.shadcn.com/docs/components/data-table)
- Forms - [React Hook Form](https://ui.shadcn.com/docs/components/form)
- AI/ML - Natural Language Processing + Query Intelligence
- Email - [Resend](https://resend.com)
- Testing - [Vitest](https://vitest.dev) + [Playwright](https://playwright.dev)
- Error tracking - [Sentry](https://sentry.io)
- Linting - [ESLint](https://eslint.org)
- Pre-commit Hooks - [Husky](https://typicode.github.io/husky/)
- Formatting - [Prettier](https://prettier.io)

_If you are looking for a Tanstack start dashboard template, here is the [repo](https://git.new/tanstack-start-dashboard)._

## Features

### Core CRM Features
- **Contact Management** - Complete customer 360° view with engagement tracking
- **Lead Scoring** - AI-powered ML-based lead qualification with confidence scoring
- **Analytics Dashboard** - Real-time KPI tracking and business intelligence
- **Booking Management** - End-to-end reservation and payment processing
- **Email Campaigns** - Automated marketing campaigns with engagement tracking
- **Live Hotel Search** - Real-time hotel availability and pricing integration

### AI-Powered Features
- **Natural Language Queries** - Ask questions about your data in German/English
- **Lead Insights** - Intelligent lead analysis with ML algorithms
- **Predictive Analytics** - Revenue forecasting and churn prediction (Phase 3.3)
- **Smart Recommendations** - AI-driven optimization suggestions (Phase 3.4)

### Technical Features
- **Multi-tenant Architecture** - Secure tenant isolation with RLS
- **Role-based Access Control** - Admin, Agent, Customer role hierarchy
- **Real-time Updates** - Live data synchronization across clients
- **Responsive Design** - Mobile-first design with accessibility support
- **Advanced Search** - Full-text search with filters and facets
- **API-first Architecture** - RESTful APIs with OpenAPI documentation
- **Comprehensive Testing** - Unit tests, E2E tests, and performance monitoring

## Pages

| Pages | Specifications |
| :---- | :------------- |
| **Authentication** | Clerk-powered auth with SSO, MFA, and session management |
| **Dashboard Overview** | Real-time KPIs, revenue analytics, and performance metrics |
| **Contacts** | Contact management with Customer 360° view and engagement timeline |
| **AI Command Center** | Natural Language Query interface, Lead Insights, and AI analytics |
| **Analytics** | Advanced business intelligence with interactive charts and reports |
| **Bookings** | Comprehensive booking management with payment processing |
| **Email Campaigns** | Campaign builder, template management, and performance tracking |
| **Settings** | User management, tenant configuration, and system preferences |

## AI Query Interface Setup

### Natural Language Query Examples

The AI Command Center supports natural language queries in German and English:

**German Examples:**
```
"Zeige mir alle heißen Leads aus Deutschland der letzten Woche"
"Wie viele Buchungen haben wir diesen Monat?"
"Welcher Umsatz wurde in den letzten 30 Tagen generiert?"
"Liste alle Kontakte mit Budget über 3000 EUR"
"Zeige mir stornierte Buchungen der letzten 7 Tage"
```

**English Examples:**
```
"Show me all hot leads from Germany in the last week"
"How many bookings do we have this month?"
"What revenue was generated in the last 30 days?"
"List all contacts with budget over 3000 EUR"
"Show me cancelled bookings from the last 7 days"
```

### Supported Query Types
- **Leads**: Lead management, scoring, filtering by status, country, budget
- **Bookings**: Reservation tracking, revenue analysis, cancellation management
- **Revenue**: Financial analytics, profit calculations, period comparisons
- **Contacts**: Customer management, segmentation, engagement tracking
- **Analytics**: Business intelligence, performance metrics, trend analysis

## Database Migrations

### AI Query Interface Tables
```sql
-- Run these migrations for AI functionality:
db/migrations/20241225_add_ai_conversations.sql
db/migrations/20241225_add_safe_query_function.sql
```

## Feature based organization

```plaintext
src/
├── app/ # Next.js App Router directory
│ ├── (auth)/ # Auth route group
│ │ ├── (signin)/
│ ├── (dashboard)/ # Dashboard route group
│ │ ├── layout.tsx
│ │ ├── loading.tsx
│ │ └── page.tsx
│ └── api/ # API routes
│
├── components/ # Shared components
│ ├── ui/ # UI components (buttons, inputs, etc.)
│ └── layout/ # Layout components (header, sidebar, etc.)
│
├── features/ # Feature-based modules
│ ├── feature/
│ │ ├── components/ # Feature-specific components
│ │ ├── actions/ # Server actions
│ │ ├── schemas/ # Form validation schemas
│ │ └── utils/ # Feature-specific utilities
│ │
├── lib/ # Core utilities and configurations
│ ├── auth/ # Auth configuration
│ ├── db/ # Database utilities
│ └── utils/ # Shared utilities
│
├── hooks/ # Custom hooks
│ └── use-debounce.ts
│
├── stores/ # Zustand stores
│ └── dashboard-store.ts
│
└── types/ # TypeScript types
└── index.ts
```

## Getting Started

> [!NOTE]  
> We are using **Next 15** with **React 19**, follow these steps:

Clone the repo:

```
git clone https://github.com/Kiranism/next-shadcn-dashboard-starter.git
```

- `pnpm install` ( we have legacy-peer-deps=true added in the .npmrc)
- Create a `.env.local` file by copying the example environment file:
  `cp env.example.txt .env.local`
- Add the required environment variables to the `.env.local` file.
- `pnpm run dev`

##### Environment Configuration Setup

To configure the environment for this project, refer to the `env.example.txt` file. This file contains the necessary environment variables required for authentication and error tracking.

You should now be able to access the application at http://localhost:3000.

> [!WARNING]
> After cloning or forking the repository, be cautious when pulling or syncing with the latest changes, as this may result in breaking conflicts.

Cheers! 🥂
