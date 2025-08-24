# 🚀 UmrahCheck CRM Dashboard

## Features für UmrahCheck CRM

### 📊 Dashboard Overview
- **Live Metrics**: Email Opens, Clicks, Conversions
- **Revenue Tracking**: Affiliate-Einnahmen in Echtzeit
- **Hotel Price Monitor**: ScrapFly Live-Daten
- **Campaign Performance**: A/B Test Results

### 📧 Email Marketing Center
- **Contact Management**: 10,000+ Kontakte verwalten
- **Segmentation**: Umrah 2025, Hajj 2025, General
- **Campaign Builder**: Drag & Drop Email Editor
- **Automation**: Preisalarm-Workflows
- **Analytics**: Open/Click/Conversion Rates

### 🏨 Hotel Management
- **Live Price Tracker**: Booking.com Preise
- **Price Alerts**: Automatische Benachrichtigungen
- **Inventory**: Verfügbare Hotels
- **Affiliate Links**: HalalBooking Integration

### 👥 Customer Portal
- **Lead Management**: Neue Interessenten
- **Booking History**: Vergangene Buchungen
- **Communication Log**: Email/Chat Historie
- **Documents**: Visa, Tickets, etc.

### 💰 Revenue Dashboard
- **Affiliate Tracking**: Provisionen von HalalBooking
- **Email ROI**: Revenue per Campaign
- **Forecasting**: Umsatzprognosen
- **Export**: Reports für Buchhaltung

## Tech Stack Integration

```typescript
// Existing Stack
- Next.js 15 + TypeScript
- Shadcn UI Components
- Clerk Authentication
- Recharts for Analytics

// New Integrations
- Resend API (Email)
- ScrapFly API (Hotels)
- Supabase (Database)
- HalalBooking (Affiliate)
```

## Quick Start

```bash
# 1. Install dependencies
cd umrahcheck-crm-dashboard
pnpm install

# 2. Setup environment
cp env.example.txt .env.local

# Add to .env.local:
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
RESEND_API_KEY=re_GjayicTJ_96myT9YP6TKFs6w853hi7Kcv
SCRAPFLY_KEY=your_scrapfly_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
HALALBOOKING_AFFILIATE_ID=pending

# 3. Run development
pnpm dev
```

## Dashboard Pages Structure

```
/dashboard
  /overview         - Main metrics & charts
  /contacts         - 10,000 email contacts
  /campaigns        - Email campaigns
  /hotels           - Live hotel prices
  /revenue          - Affiliate earnings
  /settings         - API keys & config
  /automation       - Workflows & triggers
```

## Key Components to Build

### 1. Contact Table with Filters
```tsx
<ContactsTable>
  - Search by name/email
  - Filter by segment
  - Bulk actions (email, export)
  - Import CSV (10,000 contacts)
</ContactsTable>
```

### 2. Campaign Builder
```tsx
<CampaignBuilder>
  - Template selector
  - Live preview
  - Segment targeting
  - Schedule sending
</CampaignBuilder>
```

### 3. Live Price Widget
```tsx
<LivePriceWidget>
  - Real-time Booking.com prices
  - Price drop alerts
  - Affiliate link generation
</LivePriceWidget>
```

### 4. Revenue Analytics
```tsx
<RevenueChart>
  - Daily/Weekly/Monthly views
  - Per campaign breakdown
  - Conversion funnel
  - Export to Excel
</RevenueChart>
```

## Monetization Potential

With this CRM Dashboard:
- **Manage**: 10,000+ contacts efficiently
- **Track**: Every email → click → conversion
- **Optimize**: A/B test for better results
- **Scale**: Handle 100,000+ contacts
- **Automate**: Save 20+ hours/week

## Expected Results

```
Month 1: Setup & Import
- Import 10,000 contacts
- Send first campaign
- €2,400 revenue

Month 2: Optimization
- A/B testing
- Segmentation
- €4,800 revenue

Month 3: Scale
- Automation flows
- Weekly campaigns
- €9,600+ revenue

Year 1 Target: €100,000+
```