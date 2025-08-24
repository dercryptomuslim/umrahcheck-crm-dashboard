# Resend API Integration

This project now includes integration with [Resend](https://resend.com) for email services and API key management.

## ✅ What's Fixed

The syntax error has been resolved! The issue was that you were trying to run **Python code** directly in the shell (zsh), but this is a **TypeScript/Next.js project**. 

The Python code you tried to run:
```python
params: resend.ApiKeys.CreateParams = {
  "name": "Production",
}
```

Has been converted to proper TypeScript code that works with your Next.js project.

## 🚀 Setup Instructions

### 1. Install Dependencies (Already Done)
```bash
pnpm add resend
```

### 2. Configure Environment Variables
Add your Resend API key to `.env.local`:
```bash
RESEND_API_KEY=re_your_actual_api_key_here
```

To get your API key:
1. Go to [resend.com](https://resend.com)
2. Create an account or sign in
3. Navigate to API Keys in your dashboard
4. Create a new API key
5. Copy the key and add it to your `.env.local` file

### 3. Verify Domain (For Production)
Before sending emails in production:
1. Go to your Resend dashboard
2. Add and verify your domain
3. Update the `from` field in email functions to use your verified domain

## 📁 Files Created

### Core Integration Files:
- `src/lib/resend-api.ts` - Main utility functions for Resend API
- `src/app/api/resend/api-keys/route.ts` - Next.js API route for key management
- `src/examples/resend-usage.ts` - Usage examples and demonstrations

### Updated Configuration:
- `.env.local` - Added RESEND_API_KEY configuration

## 🔧 Available Functions

### API Key Management
```typescript
import { createApiKey, listApiKeys, deleteApiKey } from '@/lib/resend-api';

// Create a new API key
const newKey = await createApiKey({
  name: 'Production',
  permission: 'full_access' // or 'sending_access'
});

// List all API keys
const keys = await listApiKeys();

// Delete an API key
await deleteApiKey('api-key-id');
```

### Email Sending
```typescript
import { sendEmail } from '@/lib/resend-api';

await sendEmail({
  from: 'noreply@yourdomain.com', // Use your verified domain
  to: 'user@example.com',
  subject: 'Welcome!',
  html: '<h1>Hello World</h1>',
  text: 'Hello World'
});
```

## 🌐 API Endpoints

### GET `/api/resend/api-keys`
List all API keys for the authenticated account.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "key-id",
      "name": "Production",
      "permission": "full_access",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST `/api/resend/api-keys`
Create a new API key.

**Request Body:**
```json
{
  "name": "My New Key",
  "permission": "full_access"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-key-id",
    "name": "My New Key",
    "token": "re_xxxxxxxxxx"
  }
}
```

### DELETE `/api/resend/api-keys?id=key-id`
Delete an API key by ID.

**Response:**
```json
{
  "success": true,
  "message": "API key deleted successfully"
}
```

## 🧪 Testing the Integration

### Using the Example Functions
```typescript
import { demonstrateResendFlow } from '@/examples/resend-usage';

// Run this in a Next.js API route or server action
await demonstrateResendFlow();
```

### Using curl to test API endpoints
```bash
# List API keys
curl -X GET http://localhost:3000/api/resend/api-keys

# Create API key
curl -X POST http://localhost:3000/api/resend/api-keys \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Key", "permission": "sending_access"}'

# Delete API key
curl -X DELETE "http://localhost:3000/api/resend/api-keys?id=your-key-id"
```

## 🔒 Security Best Practices

1. **Never commit your actual API key** to version control
2. **Use environment variables** for all sensitive data
3. **Validate inputs** in your API routes
4. **Use proper error handling** to avoid exposing sensitive information
5. **Consider rate limiting** for production applications

## 🚨 Common Issues & Solutions

### Issue: "API key not found" Error
**Solution:** Make sure `RESEND_API_KEY` is set in your `.env.local` file and restart your development server.

### Issue: "Unauthorized" Error
**Solution:** Check that your API key is valid and has the correct permissions.

### Issue: Email sending fails
**Solution:** Verify your domain in the Resend dashboard and use the verified domain in the `from` field.

## 📚 Next Steps

1. **Set up your Resend account** and get your API key
2. **Verify your domain** for production email sending
3. **Test the integration** using the provided examples
4. **Integrate email functionality** into your CRM workflows
5. **Set up proper error monitoring** for email delivery

## 📖 Additional Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend API Reference](https://resend.com/docs/api-reference)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)

---

**The syntax error has been fixed!** 🎉 You now have a proper TypeScript/Next.js integration with Resend instead of trying to run Python code in the shell.
