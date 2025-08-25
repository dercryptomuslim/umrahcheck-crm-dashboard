-- =====================================================
-- CUSTOMER 360° FOUNDATION - Multi-tenant CRM Schema
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Tenants (Agencies)
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subdomain TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'professional', 'enterprise')),
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for subdomain lookups
CREATE INDEX idx_tenants_subdomain ON public.tenants(subdomain);

-- Users (Shadow of Clerk users with tenant mapping)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'manager', 'agent')),
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for user lookups
CREATE INDEX idx_users_clerk_id ON public.users(clerk_user_id);
CREATE INDEX idx_users_tenant_id ON public.users(tenant_id);

-- Contacts (Customer records)
CREATE TABLE public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  city TEXT,
  country TEXT DEFAULT 'Germany',
  language TEXT DEFAULT 'de',
  budget_min NUMERIC,
  budget_max NUMERIC,
  segments TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  preferred_hotel_tier TEXT CHECK (preferred_hotel_tier IN ('budget', 'premium', 'luxury')),
  lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
  lead_status TEXT DEFAULT 'new' CHECK (lead_status IN ('new', 'contacted', 'qualified', 'proposal', 'won', 'lost')),
  source TEXT,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

-- Indexes for contact queries
CREATE INDEX idx_contacts_tenant_id ON public.contacts(tenant_id);
CREATE INDEX idx_contacts_email ON public.contacts(email);
CREATE INDEX idx_contacts_lead_score ON public.contacts(lead_score DESC);
CREATE INDEX idx_contacts_segments ON public.contacts USING GIN(segments);

-- Events (Engagement tracking)
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  actor TEXT NOT NULL, -- 'system' | 'user:<id>' | 'contact:<id>'
  source TEXT NOT NULL, -- 'email','whatsapp','telegram','web','api','hotel','flight'
  type TEXT NOT NULL, -- 'opened','clicked','replied','booked','paid','visited','form_submitted'
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  dedupe_key TEXT, -- For idempotency
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for event queries
CREATE INDEX idx_events_tenant_id ON public.events(tenant_id);
CREATE INDEX idx_events_contact_id ON public.events(contact_id);
CREATE INDEX idx_events_occurred_at ON public.events(occurred_at DESC);
CREATE INDEX idx_events_type ON public.events(type);
CREATE INDEX idx_events_dedupe_key ON public.events(dedupe_key);

-- Unique constraint for deduplication
CREATE UNIQUE INDEX idx_events_dedupe ON public.events(tenant_id, dedupe_key) 
WHERE dedupe_key IS NOT NULL;

-- Bookings (Transactions)
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('hotel', 'flight', 'package', 'visa', 'transfer')),
  provider TEXT, -- 'halalbooking','booking','duffel','manual'
  external_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  amount NUMERIC NOT NULL,
  commission NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'EUR',
  check_in DATE,
  check_out DATE,
  meta JSONB DEFAULT '{}'::jsonb,
  booked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for booking queries
CREATE INDEX idx_bookings_tenant_id ON public.bookings(tenant_id);
CREATE INDEX idx_bookings_contact_id ON public.bookings(contact_id);
CREATE INDEX idx_bookings_booked_at ON public.bookings(booked_at DESC);
CREATE INDEX idx_bookings_status ON public.bookings(status);

-- =====================================================
-- MATERIALIZED VIEWS
-- =====================================================

-- Contact engagement metrics
CREATE MATERIALIZED VIEW public.mv_contact_engagement AS
SELECT 
  c.tenant_id,
  c.id AS contact_id,
  c.email,
  c.lead_score,
  COUNT(e.*) FILTER (WHERE e.type = 'opened') AS email_opens,
  COUNT(e.*) FILTER (WHERE e.type = 'clicked') AS email_clicks,
  COUNT(e.*) FILTER (WHERE e.type = 'replied') AS email_replies,
  COUNT(e.*) FILTER (WHERE e.type = 'visited') AS web_visits,
  COUNT(e.*) FILTER (WHERE e.type = 'booked') AS bookings_count,
  MAX(e.occurred_at) AS last_activity_at,
  MIN(e.occurred_at) AS first_activity_at,
  COUNT(DISTINCT e.type) AS activity_types,
  COUNT(e.*) AS total_events
FROM public.contacts c
LEFT JOIN public.events e ON e.contact_id = c.id AND e.tenant_id = c.tenant_id
GROUP BY c.tenant_id, c.id, c.email, c.lead_score;

-- Create indexes on materialized view
CREATE INDEX idx_mv_engagement_tenant ON public.mv_contact_engagement(tenant_id);
CREATE INDEX idx_mv_engagement_contact ON public.mv_contact_engagement(contact_id);
CREATE INDEX idx_mv_engagement_last_activity ON public.mv_contact_engagement(last_activity_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Helper function to extract tenant_id from JWT
CREATE OR REPLACE FUNCTION auth.tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (auth.jwt() -> 'app_metadata' ->> 'tenant_id')::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

-- Helper function to extract user role from JWT
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    auth.jwt() -> 'app_metadata' ->> 'role',
    'agent'
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- TENANTS: Only admins can read their own tenant
CREATE POLICY tenant_read ON public.tenants
  FOR SELECT USING (
    id = auth.tenant_id() AND 
    auth.user_role() IN ('admin', 'manager')
  );

CREATE POLICY tenant_update ON public.tenants
  FOR UPDATE USING (
    id = auth.tenant_id() AND 
    auth.user_role() = 'admin'
  );

-- USERS: All users can read users in their tenant
CREATE POLICY users_read ON public.users
  FOR SELECT USING (tenant_id = auth.tenant_id());

CREATE POLICY users_insert ON public.users
  FOR INSERT WITH CHECK (
    tenant_id = auth.tenant_id() AND 
    auth.user_role() = 'admin'
  );

CREATE POLICY users_update ON public.users
  FOR UPDATE USING (
    tenant_id = auth.tenant_id() AND 
    auth.user_role() = 'admin'
  );

CREATE POLICY users_delete ON public.users
  FOR DELETE USING (
    tenant_id = auth.tenant_id() AND 
    auth.user_role() = 'admin'
  );

-- CONTACTS: All users can CRUD contacts in their tenant
CREATE POLICY contacts_read ON public.contacts
  FOR SELECT USING (tenant_id = auth.tenant_id());

CREATE POLICY contacts_insert ON public.contacts
  FOR INSERT WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY contacts_update ON public.contacts
  FOR UPDATE USING (tenant_id = auth.tenant_id());

CREATE POLICY contacts_delete ON public.contacts
  FOR DELETE USING (
    tenant_id = auth.tenant_id() AND 
    auth.user_role() IN ('admin', 'manager')
  );

-- EVENTS: All users can CRUD events in their tenant
CREATE POLICY events_read ON public.events
  FOR SELECT USING (tenant_id = auth.tenant_id());

CREATE POLICY events_insert ON public.events
  FOR INSERT WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY events_update ON public.events
  FOR UPDATE USING (
    tenant_id = auth.tenant_id() AND 
    auth.user_role() IN ('admin', 'manager')
  );

CREATE POLICY events_delete ON public.events
  FOR DELETE USING (
    tenant_id = auth.tenant_id() AND 
    auth.user_role() = 'admin'
  );

-- BOOKINGS: All users can read, managers can edit
CREATE POLICY bookings_read ON public.bookings
  FOR SELECT USING (tenant_id = auth.tenant_id());

CREATE POLICY bookings_insert ON public.bookings
  FOR INSERT WITH CHECK (tenant_id = auth.tenant_id());

CREATE POLICY bookings_update ON public.bookings
  FOR UPDATE USING (
    tenant_id = auth.tenant_id() AND 
    auth.user_role() IN ('admin', 'manager')
  );

CREATE POLICY bookings_delete ON public.bookings
  FOR DELETE USING (
    tenant_id = auth.tenant_id() AND 
    auth.user_role() = 'admin'
  );

-- =====================================================
-- TRIGGERS & FUNCTIONS
-- =====================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update trigger to relevant tables
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION public.refresh_engagement_metrics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_contact_engagement;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SEED DATA (Example tenant for development)
-- =====================================================

-- Insert example tenant
INSERT INTO public.tenants (subdomain, name, plan) 
VALUES ('demo', 'Demo Agency', 'professional')
ON CONFLICT (subdomain) DO NOTHING;