import { Resend } from 'resend';

// Initialize Resend with your API key
// Make sure to add RESEND_API_KEY to your environment variables
let resend: Resend;

if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
} else {
  // Create a dummy instance for build time
  resend = new Resend('re_dummy_key_for_build');
}

export interface CreateApiKeyParams {
  name: string;
  permission?: 'full_access' | 'sending_access';
}

export interface ApiKey {
  id: string;
  name: string;
  permission: string;
  created_at: string;
}

/**
 * Create API key
 * Add a new API key to authenticate with Resend.
 */
export async function createApiKey(params: CreateApiKeyParams) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }

  try {
    const result = await resend.apiKeys.create({
      name: params.name,
      permission: params.permission || 'full_access'
    });

    if (result.error) {
      throw new Error(`Failed to create API key: ${result.error.message}`);
    }

    return result.data;
  } catch (error) {
    console.error('Error creating API key:', error);
    throw error;
  }
}

/**
 * List API keys
 * Retrieve a list of API keys for the authenticated user.
 */
export async function listApiKeys() {
  try {
    const result = await resend.apiKeys.list();

    if (result.error) {
      throw new Error(`Failed to list API keys: ${result.error.message}`);
    }

    return result.data;
  } catch (error) {
    console.error('Error listing API keys:', error);
    throw error;
  }
}

/**
 * Delete API key
 * Remove an existing API key.
 */
export async function deleteApiKey(apiKeyId: string) {
  try {
    const result = await resend.apiKeys.remove(apiKeyId);

    if (result.error) {
      throw new Error(`Failed to delete API key: ${result.error.message}`);
    }

    return result.data;
  } catch (error) {
    console.error('Error deleting API key:', error);
    throw error;
  }
}

/**
 * Send email using Resend
 */
export async function sendEmail(params: {
  from: string;
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}) {
  try {
    // Ensure at least text or html is provided
    const emailData: any = {
      from: params.from,
      to: params.to,
      subject: params.subject
    };

    if (params.html) {
      emailData.html = params.html;
    }

    if (params.text) {
      emailData.text = params.text;
    } else if (!params.html) {
      // If no html and no text, provide a default text
      emailData.text = params.subject;
    }

    const result = await resend.emails.send(emailData);

    if (result.error) {
      throw new Error(`Failed to send email: ${result.error.message}`);
    }

    return result.data;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export default resend;
