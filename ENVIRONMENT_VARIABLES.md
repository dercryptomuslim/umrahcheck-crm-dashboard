# 🔐 Environment Variables für Vercel CRM Dashboard

## 📝 Komplette Liste für Vercel Dashboard

Gehen Sie zu: **Vercel → Ihr CRM Projekt → Settings → Environment Variables**

### 🔑 Authentication (Clerk) - REQUIRED
```
Name: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
Value: pk_test_c2F2aW5nLXBvcnBvaXNlLTMuY2xlcmsuYWNjb3VudHMuZGV2JA
Environment: Production, Preview, Development

Name: CLERK_SECRET_KEY  
Value: sk_test_Ks970atFBtyH5o7KyGYVuETAaVZohURVCr4Ua2juD1
Environment: Production, Preview, Development
```

### 🌐 Clerk Redirect URLs - REQUIRED
```
Name: NEXT_PUBLIC_CLERK_SIGN_IN_URL
Value: /auth/sign-in
Environment: Production, Preview, Development

Name: NEXT_PUBLIC_CLERK_SIGN_UP_URL
Value: /auth/sign-up  
Environment: Production, Preview, Development

Name: NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
Value: /dashboard/overview
Environment: Production, Preview, Development

Name: NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
Value: /dashboard/overview
Environment: Production, Preview, Development
```

### 📧 Email Service (Resend) - REQUIRED
```
Name: RESEND_API_KEY
Value: re_GjayicTJ_96myT9YP6TKFs6w853hi7Kcv
Environment: Production, Preview, Development
```

### 🏗️ Build Optimization - REQUIRED
```
Name: NODE_OPTIONS
Value: --max-old-space-size=4096
Environment: Production, Preview, Development
```

### 📊 Error Tracking (Sentry) - OPTIONAL
```
Name: NEXT_PUBLIC_SENTRY_DSN
Value: https://your-dsn@sentry.io/project-id
Environment: Production, Preview

Name: NEXT_PUBLIC_SENTRY_ORG
Value: umrahcheck
Environment: Production, Preview

Name: NEXT_PUBLIC_SENTRY_PROJECT
Value: crm-dashboard
Environment: Production, Preview

Name: SENTRY_AUTH_TOKEN
Value: your-sentry-auth-token
Environment: Production, Preview

Name: NEXT_PUBLIC_SENTRY_DISABLED
Value: false
Environment: Production, Preview
```

## ⚙️ Vercel Build Settings

### Framework & Build
- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next` (default)
- **Install Command:** `npm install --legacy-peer-deps`

### Node.js Version
- **Node.js Version:** 18.x (Latest LTS)

## 🚀 Deployment Commands

### In Vercel Dashboard:
1. **Settings** → **Environment Variables**
2. **Add New Variable** für jede oben aufgeführte Variable
3. **Save** nach jeder Eingabe
4. **Redeploy** das Projekt nach allen Änderungen

### CLI Alternative:
```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Set environment variables
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
vercel env add CLERK_SECRET_KEY production
vercel env add RESEND_API_KEY production
# ... etc für alle Variables

# Deploy
vercel --prod
```

## 🔍 Verification nach Deployment

### 1. Environment Variables testen
```javascript
// Testcode in /api/env-check/route.ts
export async function GET() {
  return Response.json({
    clerk_public: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? 'Set' : 'Missing',
    clerk_secret: process.env.CLERK_SECRET_KEY ? 'Set' : 'Missing',
    resend: process.env.RESEND_API_KEY ? 'Set' : 'Missing',
    node_options: process.env.NODE_OPTIONS || 'Not Set'
  });
}
```

### 2. API Endpoints testen
```bash
# After deployment
curl https://crm.umrahcheck.de/api/env-check
# Should return all variables as "Set"

curl -X POST https://crm.umrahcheck.de/api/live-hotel-search
# Should not return env variable errors
```

### 3. Authentication testen
- Besuchen Sie: https://crm.umrahcheck.de
- Login sollte zur Clerk-Seite umleiten
- Nach Login sollte Dashboard erreichbar sein

## 🛠️ Troubleshooting

### Build Errors
```bash
# If memory issues during build
NODE_OPTIONS=--max-old-space-size=8192

# If peer dependency issues
npm install --legacy-peer-deps
```

### Environment Variable Errors
```javascript
// Check in production logs
console.log('Environment Check:', {
  clerk: !!process.env.CLERK_SECRET_KEY,
  resend: !!process.env.RESEND_API_KEY,
  nodeEnv: process.env.NODE_ENV
});
```

### CORS Issues
```javascript
// Add to API routes if needed
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

## 🎯 Production Ready Checklist

### ✅ Required Environment Variables
- [x] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- [x] CLERK_SECRET_KEY
- [x] RESEND_API_KEY
- [x] All Clerk redirect URLs
- [x] NODE_OPTIONS for build

### ✅ Optional but Recommended
- [ ] Sentry error tracking variables
- [ ] Analytics configuration
- [ ] Custom domain environment variables

### ✅ After Deployment
- [ ] Test login system
- [ ] Test all API endpoints
- [ ] Test email sending
- [ ] Test hotel search
- [ ] Test CSV upload
- [ ] Test affiliate links

---

**🚀 Ready to Deploy!** Alle Environment Variables sind konfiguriert und das CRM Dashboard ist produktionsbereit.