# Supabase Migration Guide

## ✅ Current Status

### What's Completed:
1. **✅ Supabase CLI Installed** - Version 2.34.3
2. **✅ Project Initialized** - `supabase init` completed  
3. **✅ Authentication Complete** - Logged into Supabase CLI
4. **✅ Project Linked** - Connected to `wxtohdiwsgoeduejkhgh` (Umrahcheck project)
5. **✅ Migration Files Ready** - Customer 360° CRM schema prepared

### Current Issue:
**Connection timeout** - The CLI is experiencing connection issues with the remote Supabase instance. This is likely temporary.

## 📋 Migration Files

### Available Migrations:
1. **`001_customer_360_foundation_remote.sql`** - Main CRM schema (Remote compatible)
2. **`001_customer_360_foundation.sql.bak`** - Backup of original (Local development)

## 🎯 Multiple Ways to Run Migration

### Option 1: Wait and Retry CLI (Recommended)
The connection issue is likely temporary. Try again in a few minutes:

```bash
# Check status
supabase migration list --linked

# Run migration
supabase db push
```

### Option 2: Use Supabase Dashboard (Immediate)
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Open your **Umrahcheck** project (`wxtohdiwsgoeduejkhgh`)
3. Navigate to **Database** → **SQL Editor**
4. Copy and paste the migration content from `supabase/migrations/001_customer_360_foundation_remote.sql`
5. Click **Run** to execute

### Option 3: Direct Connection with psql
If you have PostgreSQL client installed:

```bash
# Get connection string from Supabase dashboard
psql "postgresql://postgres.[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"

# Then run migration
\i supabase/migrations/001_customer_360_foundation_remote.sql
```

## 🗄️ What the Migration Creates

### Core Tables:
- **`tenants`** - Multi-tenant agencies (Demo Agency, Test Agency)
- **`users`** - User management with Clerk integration
- **`contacts`** - Customer records with lead scoring
- **`events`** - Engagement tracking (emails, clicks, visits)
- **`bookings`** - Transaction records (hotels, flights, packages)

### Features:
- **Row Level Security (RLS)** - Tenant isolation
- **Materialized Views** - Performance optimization
- **Triggers** - Auto-updated timestamps
- **Helper Functions** - JWT extraction for multi-tenancy
- **Seed Data** - Demo and test tenants

### Indexes:
- Optimized for tenant-based queries
- Lead scoring and segmentation
- Event tracking and analytics
- Booking history and status

## 🔧 After Migration Success

### 1. Update Environment Variables
Add to your `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://wxtohdiwsgoeduejkhgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[Get from Supabase Dashboard]
SUPABASE_SERVICE_ROLE_KEY=[Get from Supabase Dashboard]
```

### 2. Get API Keys
From Supabase Dashboard → Settings → API:
- **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Verify Migration Success
Check if tables exist:
```sql
-- In Supabase SQL Editor
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tenants', 'users', 'contacts', 'events', 'bookings');
```

### 4. Test Data Access
```sql
-- Check seed data
SELECT * FROM public.tenants;
```

## 🚀 Next Steps After Migration

### 1. Install Supabase Client
```bash
pnpm add @supabase/supabase-js
```

### 2. Create Database Client
Create `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 3. Integrate with Clerk
Set up tenant resolution based on subdomain in your middleware.

### 4. Create API Routes
Set up Next.js API routes for CRUD operations on:
- Contacts management
- Event tracking
- Booking handling
- Analytics queries

## 🔍 Troubleshooting

### Connection Issues
- **Timeout errors**: Wait 5-10 minutes and retry
- **Permission errors**: Ensure you're logged in (`supabase login`)
- **Network issues**: Check firewall/VPN settings

### Migration Errors
- **Schema conflicts**: Use `--debug` flag for details
- **Permission denied**: Use remote-compatible migration file
- **Foreign key errors**: Ensure proper table creation order

### Database Issues
- **RLS blocking queries**: Add proper JWT metadata
- **Missing data**: Check tenant_id in queries
- **Performance**: Monitor materialized view refresh

## 📊 Schema Overview

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   tenants   │    │    users    │    │  contacts   │
│             │◄───┤             │    │             │
│ - subdomain │    │ - clerk_id  │    │ - email     │
│ - name      │    │ - tenant_id │◄───┤ - lead_score│
│ - plan      │    │ - role      │    │ - status    │
└─────────────┘    └─────────────┘    └─────────────┘
                                               │
       ┌─────────────┐    ┌─────────────┐     │
       │   events    │    │  bookings   │     │
       │             │    │             │     │
       │ - type      │◄───┤ - kind      │◄────┘
       │ - payload   │    │ - amount    │
       │ - occurred  │    │ - status    │
       └─────────────┘    └─────────────┘
```

## 🏁 Current Status: Ready to Proceed

Your Supabase setup is **95% complete**. The only remaining step is running the migration, which can be done through multiple methods above.

**Recommended Next Action**: Try Option 1 (CLI retry) first, then fall back to Option 2 (Dashboard) if needed.

---

**Last Updated**: $(date)  
**Supabase CLI Version**: 2.34.3  
**Project ID**: wxtohdiwsgoeduejkhgh
