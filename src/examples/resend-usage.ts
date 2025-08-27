/**
 * Resend API Usage Examples
 *
 * This file demonstrates how to use the Resend API functions.
 * Make sure to set RESEND_API_KEY in your .env.local file first.
 */

import {
  createApiKey,
  listApiKeys,
  deleteApiKey,
  sendEmail
} from '@/lib/resend-api';

// Example 1: Create a new API key
export async function exampleCreateApiKey() {
  try {
    const newApiKey = await createApiKey({
      name: 'Production',
      permission: 'full_access' // or 'sending_access'
    });

    return newApiKey;
  } catch (error) {
    // Error logged: console.error('Failed to create API key:', error);
    throw error;
  }
}

// Example 2: List all API keys
export async function exampleListApiKeys() {
  try {
    const apiKeys = await listApiKeys();

    return apiKeys;
  } catch (error) {
    // Error logged: console.error('Failed to list API keys:', error);
    throw error;
  }
}

// Example 3: Delete an API key
export async function exampleDeleteApiKey(apiKeyId: string) {
  try {
    const result = await deleteApiKey(apiKeyId);

    return result;
  } catch (error) {
    // Error logged: console.error('Failed to delete API key:', error);
    throw error;
  }
}

// Example 4: Send an email
export async function exampleSendEmail() {
  try {
    const email = await sendEmail({
      from: 'onboarding@resend.dev', // Use your verified domain
      to: 'user@example.com',
      subject: 'Hello from Umrah Check CRM!',
      html: `
        <div>
          <h1>Welcome to Umrah Check CRM</h1>
          <p>Thank you for joining our platform!</p>
          <p>Best regards,<br>The Umrah Check Team</p>
        </div>
      `,
      text: 'Welcome to Umrah Check CRM! Thank you for joining our platform!'
    });

    return email;
  } catch (error) {
    // Error logged: console.error('Failed to send email:', error);
    throw error;
  }
}

// Example function to demonstrate the complete flow
export async function demonstrateResendFlow() {

  try {
    // Step 1: List existing API keys
    const existingKeys = await exampleListApiKeys();

    // Step 2: Create a new API key
    const newKey = await exampleCreateApiKey();

    // Step 3: Send a test email
    const emailResult = await exampleSendEmail();

    // Step 4: Clean up - delete the test API key (optional)
    if (newKey?.id) {
      await exampleDeleteApiKey(newKey.id);
    }

  } catch (error) {
    // Error logged: console.error('❌ Demonstration failed:', error);
  }
}

// Export for use in other files
export { createApiKey, listApiKeys, deleteApiKey, sendEmail };
