# 🌐 Domain Routing Setup für UmrahCheck SaaS

## 🎯 Architektur Übersicht

```
umrahcheck.de (Customer Website)
├── / (Homepage)
├── /angebote (Umrah Packages)  
├── /preisvergleich (Price Comparison)
├── /kontakt (Contact Form)
└── /umrah-anfrage (Lead Generation)

crm.umrahcheck.de (Admin CRM Dashboard)
├── /dashboard (Admin Overview)
├── /dashboard/hotels (Live Hotel Search)
├── /dashboard/contacts (Email Management) 
├── /dashboard/campaigns (Email Marketing)
└── /api/* (All CRM APIs)
```

## 🔧 DNS Konfiguration

### 1. Hauptdomain (Customer Website)
```dns
# umrahcheck.de → umrahcheck-frontend-v2
Type: A
Name: @
Value: 76.76.19.61 (Vercel IP)

Type: CNAME  
Name: www
Value: cname.vercel-dns.com
```

### 2. CRM Subdomain (Admin Dashboard)
```dns
# crm.umrahcheck.de → umrahcheck-crm-dashboard  
Type: CNAME
Name: crm
Value: cname.vercel-dns.com
```

## 📋 Vercel Projekt-Setup

### Projekt 1: Customer Website
- **Domain:** umrahcheck.de + www.umrahcheck.de
- **Repository:** dercryptomuslim/umrahcheck-frontend-v2
- **Framework:** Next.js 15
- **Features:** Customer Pages, Lead Forms, SEO

### Projekt 2: CRM Dashboard  
- **Domain:** crm.umrahcheck.de
- **Repository:** dercryptomuslim/umrahcheck-crm-dashboard
- **Framework:** Next.js 15
- **Features:** Hotel Search, Email Marketing, Contact Management

## 🔐 Authentication Flow

### Customer Website (Öffentlich)
- Keine Authentication erforderlich
- Lead-Formulare für Umrah-Anfragen
- Contact Forms

### CRM Dashboard (Geschützt)
- **Clerk Authentication** erforderlich
- Nur für Agenturen/Admin
- Sichere API-Endpoints

## 📡 API Integration zwischen Projekten

### Customer → CRM API Calls
```javascript
// Customer Website ruft CRM APIs auf
const apiBaseUrl = 'https://crm.umrahcheck.de/api';

// Hotel Search von Customer Website
const hotelSearch = async (criteria) => {
  const response = await fetch(`${apiBaseUrl}/live-hotel-search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': 'https://umrahcheck.de'
    },
    body: JSON.stringify(criteria)
  });
  return response.json();
};
```

### CORS Konfiguration
```javascript
// CRM Dashboard API allows Customer Website
const allowedOrigins = [
  'https://umrahcheck.de',
  'https://www.umrahcheck.de',
  'https://crm.umrahcheck.de'
];
```

## 🎯 Lead Flow Integration

### Customer Journey
1. **Customer:** Besucht umrahcheck.de
2. **Lead Form:** Füllt Umrah-Anfrage aus
3. **API Call:** umrahcheck.de → crm.umrahcheck.de/api/leads
4. **CRM Processing:** Email-Kampagne automatisch gestartet
5. **Admin:** Sieht Lead im CRM Dashboard

### Lead API Endpoint (Neu erstellen)
```typescript
// crm.umrahcheck.de/api/leads
export async function POST(request: Request) {
  const leadData = await request.json();
  
  // 1. Save to contacts database
  // 2. Trigger welcome email campaign  
  // 3. Notify admin dashboard
  // 4. Return confirmation to customer website
  
  return Response.json({ 
    success: true, 
    leadId: 'lead_12345',
    message: 'Ihre Anfrage wurde erfolgreich übermittelt!'
  });
}
```

## 🚀 Deployment Reihenfolge

### Phase 1: CRM Dashboard (JETZT)
1. ✅ GitHub Repository: umrahcheck-crm-dashboard
2. ✅ Vercel Projekt erstellen
3. ⏳ Environment Variables konfigurieren
4. ⏳ Domain crm.umrahcheck.de verbinden
5. ⏳ DNS CNAME Record erstellen

### Phase 2: Customer Website Integration
1. Frontend-Repository aktualisieren
2. API Integration implementieren
3. Lead-Forms mit CRM verbinden
4. Domain umrahcheck.de konfigurieren

## 🛡️ Sicherheit & Performance

### Security Headers (beide Projekte)
```javascript
// Automatic von Vercel/Next.js
- X-Frame-Options: SAMEORIGIN
- X-XSS-Protection: 1; mode=block
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
```

### Performance Optimization
- **Customer Website:** Image Optimization, SEO, Fast Loading
- **CRM Dashboard:** Admin-optimiert, Real-time Updates, Bulk Operations

## ✅ Testing Checklist

### Nach Domain-Setup testen:
```bash
# DNS Propagation testen
nslookup crm.umrahcheck.de
# Sollte zurückgeben: cname.vercel-dns.com

# SSL Certificate testen  
curl -I https://crm.umrahcheck.de
# Sollte 200 OK zurückgeben

# API Endpoints testen
curl -X POST https://crm.umrahcheck.de/api/live-hotel-search
```

### Browser Tests:
- [ ] https://crm.umrahcheck.de → CRM Dashboard Login
- [ ] https://crm.umrahcheck.de/dashboard → Admin Interface  
- [ ] https://crm.umrahcheck.de/api/live-hotel-search → API Response

## 📈 Analytics & Monitoring

### Vercel Analytics (beide Projekte)
- Performance Monitoring
- User Analytics  
- API Usage Tracking
- Error Monitoring

### Custom Tracking
```javascript
// Customer Website Analytics
// Track: Page Views, Lead Conversions, Form Submissions

// CRM Dashboard Analytics  
// Track: Hotel Searches, Email Campaigns, User Activity
```

---

**🎯 Nächste Schritte:**
1. Environment Variables in Vercel konfigurieren
2. DNS CNAME Record für crm.umrahcheck.de erstellen
3. SSL Certificate automatisch generieren lassen
4. Alle APIs testen
5. Lead Integration zwischen beiden Projekten implementieren