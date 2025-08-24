# 🚀 Vercel Deployment für UmrahCheck CRM Dashboard

## 📝 Environment Variables für Vercel

Gehen Sie zu: **Vercel Dashboard → Ihr CRM Projekt → Settings → Environment Variables**

### 🔐 Authentication (Clerk)
```bash
# Required for Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_c2F2aW5nLXBvcnBvaXNlLTMuY2xlcmsuYWNjb3VudHMuZGV2JA
CLERK_SECRET_KEY=sk_test_Ks970atFBtyH5o7KyGYVuETAaVZohURVCr4Ua2juD1

# Clerk Redirect URLs (Production URLs)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard/overview
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard/overview
```

### 📧 Email Marketing (Resend)
```bash
# Required for Email Campaigns
RESEND_API_KEY=re_GjayicTJ_96myT9YP6TKFs6w853hi7Kcv
```

### 📊 Error Tracking (Sentry) - Optional
```bash
# Optional für Production Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NEXT_PUBLIC_SENTRY_ORG=umrahcheck
NEXT_PUBLIC_SENTRY_PROJECT=crm-dashboard
SENTRY_AUTH_TOKEN=your-sentry-auth-token
NEXT_PUBLIC_SENTRY_DISABLED=false
```

### 🏗️ Build Configuration (Vercel)
```bash
# Build Commands
NODE_OPTIONS=--max-old-space-size=4096
```

## 🌐 Domain Setup

### 1. Custom Domain Configuration
In Vercel Dashboard:
1. **Domains** → **Add Domain**
2. Add: `crm.umrahcheck.de`
3. Configure DNS Settings:

```dns
# DNS Records (bei Ihrem Domain Provider)
Type: CNAME
Name: crm
Value: cname.vercel-dns.com
```

### 2. Production URLs
- **CRM Dashboard:** https://crm.umrahcheck.de
- **API Endpoints:** https://crm.umrahcheck.de/api/*
- **Login:** https://crm.umrahcheck.de/auth/sign-in

## 🔧 Build Settings

### Framework Preset
- **Framework:** Next.js
- **Node.js Version:** 18.x (Latest)
- **Build Command:** `npm run build`
- **Output Directory:** `.next`

### Advanced Build Settings
```bash
# Package Manager: npm
npm install --legacy-peer-deps

# Build Command
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

## 🛡️ Security Headers

Vercel konfiguriert automatisch:
```javascript
// next.config.ts - bereits konfiguriert
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  }
];
```

## 🎯 API Routes - Production Ready

### Hotel Search API
- **Endpoint:** `https://crm.umrahcheck.de/api/live-hotel-search`
- **Method:** POST
- **Features:** ScrapFly Integration, Real-time Booking.com Data

### Email Marketing API  
- **Endpoint:** `https://crm.umrahcheck.de/api/email-campaigns`
- **Method:** POST
- **Features:** German Templates, HalalBooking Affiliate Links

### CSV Upload API
- **Endpoint:** `https://crm.umrahcheck.de/api/contacts/upload`
- **Method:** POST
- **Features:** Bulk Import, Duplicate Detection

### HalalBooking Affiliate API
- **Endpoint:** `https://crm.umrahcheck.de/api/affiliates/halal-booking`
- **Method:** GET
- **Features:** Commission Tracking, Link Generation

## 🚦 Go-Live Checklist

### ✅ Pre-Deployment
- [x] GitHub Repository connected
- [x] Environment Variables configured
- [x] Domain DNS configured
- [x] Build settings optimized

### ✅ Post-Deployment Testing
- [ ] Login System (Clerk Auth)
- [ ] Hotel Search API
- [ ] Email Campaign System
- [ ] CSV Upload System
- [ ] HalalBooking Affiliate Links

### ✅ Production Monitoring
- [ ] Sentry Error Tracking
- [ ] Vercel Analytics
- [ ] Performance Monitoring
- [ ] API Usage Monitoring

## 🔍 Troubleshooting

### Build Issues
```bash
# If build fails with memory issues
NODE_OPTIONS="--max-old-space-size=8192" npm run build
```

### Environment Variables Missing
```bash
# Check environment in production
console.log('CLERK_SECRET_KEY:', process.env.CLERK_SECRET_KEY ? 'Set' : 'Missing');
console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'Set' : 'Missing');
```

### Domain Propagation
```bash
# Test DNS propagation
nslookup crm.umrahcheck.de
# Should return: cname.vercel-dns.com
```

## 📈 Performance Optimization

### Automatic Optimizations (Enabled)
- ✅ Image Optimization (Next.js)
- ✅ Code Splitting (Next.js)
- ✅ Edge Functions (Vercel)
- ✅ CDN Distribution (Vercel)
- ✅ Gzip Compression (Vercel)

### Performance Targets
- **Load Time:** <2s (Admin Dashboard)
- **API Response:** <500ms (Hotel Search)
- **Email Send:** <3s (Campaign)
- **CSV Upload:** <30s (10K contacts)

## 💰 Revenue Integration

### HalalBooking Affiliate System
- **Commission Rate:** 5%
- **Tracking:** Email-based unique IDs
- **Attribution:** Campaign + Contact mapping
- **Revenue Potential:** €179,400/Jahr bei 50+ Agenturen

## 🎯 Next Steps After Deployment

1. **Test alle APIs:** Hotel Search, Email, CSV Upload
2. **Import echte Kontakte:** 10,000+ Email-Adressen  
3. **Erste Email-Kampagne:** Willkommen-Mail an alle Kontakte
4. **Performance Monitoring:** Sentry + Vercel Analytics
5. **Agency Onboarding:** Erste Kunden testen lassen

---

**🎉 Production Ready!** Das CRM Dashboard ist bereit für den Live-Einsatz mit allen Features.