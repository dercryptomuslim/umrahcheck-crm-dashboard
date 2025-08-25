import { z } from 'zod';

// =====================================================
// CORE TYPES
// =====================================================

export type TenantPlan = 'starter' | 'professional' | 'enterprise';
export type UserRole = 'admin' | 'manager' | 'agent';
export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'won'
  | 'lost';
export type HotelTier = 'budget' | 'premium' | 'luxury';
export type BookingKind = 'hotel' | 'flight' | 'package' | 'visa' | 'transfer';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export type EventSource =
  | 'email'
  | 'whatsapp'
  | 'telegram'
  | 'web'
  | 'api'
  | 'hotel'
  | 'flight';
export type EventType =
  | 'opened'
  | 'clicked'
  | 'replied'
  | 'booked'
  | 'paid'
  | 'visited'
  | 'form_submitted'
  | 'campaign_sent'
  | 'lead_created'
  | 'lead_updated';

// =====================================================
// DATABASE MODELS
// =====================================================

export interface Tenant {
  id: string;
  subdomain: string;
  name: string;
  plan: TenantPlan;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  clerk_user_id: string;
  tenant_id: string;
  role: UserRole;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Contact {
  id: string;
  tenant_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  city?: string;
  country?: string;
  language?: string;
  budget_min?: number;
  budget_max?: number;
  segments: string[];
  tags: string[];
  preferred_hotel_tier?: HotelTier;
  lead_score: number;
  lead_status: LeadStatus;
  source?: string;
  meta: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  tenant_id: string;
  contact_id?: string;
  actor: string;
  source: EventSource;
  type: EventType;
  payload: Record<string, any>;
  dedupe_key?: string;
  occurred_at: string;
  created_at: string;
}

export interface Booking {
  id: string;
  tenant_id: string;
  contact_id: string;
  kind: BookingKind;
  provider?: string;
  external_id?: string;
  status: BookingStatus;
  amount: number;
  commission: number;
  currency: string;
  check_in?: string;
  check_out?: string;
  meta: Record<string, any>;
  booked_at: string;
  created_at: string;
  updated_at: string;
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface Contact360Response {
  contact: Contact;
  timeline: Event[];
  bookings: Booking[];
  engagement: ContactEngagement;
}

export interface ContactEngagement {
  tenant_id: string;
  contact_id: string;
  email: string;
  lead_score: number;
  email_opens: number;
  email_clicks: number;
  email_replies: number;
  web_visits: number;
  bookings_count: number;
  last_activity_at?: string;
  first_activity_at?: string;
  activity_types: number;
  total_events: number;
}

// =====================================================
// ZOD VALIDATION SCHEMAS
// =====================================================

// Event Ingestion Schema
export const EventIngestionSchema = z.object({
  contact_id: z.string().uuid().optional(),
  actor: z.string().default('system'),
  source: z.enum([
    'email',
    'whatsapp',
    'telegram',
    'web',
    'api',
    'hotel',
    'flight'
  ]),
  type: z.enum([
    'opened',
    'clicked',
    'replied',
    'booked',
    'paid',
    'visited',
    'form_submitted',
    'campaign_sent',
    'lead_created',
    'lead_updated'
  ]),
  payload: z.record(z.any()).default({}),
  dedupe_key: z.string().optional(),
  occurred_at: z.string().datetime().optional()
});

export type EventIngestionInput = z.infer<typeof EventIngestionSchema>;

// Contact Creation Schema
export const ContactCreationSchema = z.object({
  email: z.string().email(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  country: z.string().default('Germany'),
  language: z.string().default('de'),
  budget_min: z.number().optional(),
  budget_max: z.number().optional(),
  segments: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  preferred_hotel_tier: z.enum(['budget', 'premium', 'luxury']).optional(),
  lead_status: z
    .enum(['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'])
    .default('new'),
  source: z.string().optional(),
  meta: z.record(z.any()).default({})
});

export type ContactCreationInput = z.infer<typeof ContactCreationSchema>;

// Contact Update Schema
export const ContactUpdateSchema = ContactCreationSchema.partial();
export type ContactUpdateInput = z.infer<typeof ContactUpdateSchema>;

// Booking Creation Schema
export const BookingCreationSchema = z.object({
  contact_id: z.string().uuid(),
  kind: z.enum(['hotel', 'flight', 'package', 'visa', 'transfer']),
  provider: z.string().optional(),
  external_id: z.string().optional(),
  status: z
    .enum(['pending', 'confirmed', 'cancelled', 'completed'])
    .default('pending'),
  amount: z.number(),
  commission: z.number().default(0),
  currency: z.string().default('EUR'),
  check_in: z.string().datetime().optional(),
  check_out: z.string().datetime().optional(),
  meta: z.record(z.any()).default({}),
  booked_at: z.string().datetime().optional()
});

export type BookingCreationInput = z.infer<typeof BookingCreationSchema>;

// KPI Response Schema
export const KPISchema = z.object({
  contacts_total: z.number(),
  contacts_new_30d: z.number(),
  revenue_30d: z.number(),
  revenue_total: z.number(),
  bookings_30d: z.number(),
  bookings_total: z.number(),
  avg_lead_score: z.number(),
  hot_leads: z.number(),
  conversion_rate: z.number()
});

export type KPIResponse = z.infer<typeof KPISchema>;
