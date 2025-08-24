import { NextRequest, NextResponse } from 'next/server';
import { createApiKey, listApiKeys, deleteApiKey } from '@/lib/resend-api';

// GET /api/resend/api-keys - List all API keys
export async function GET() {
  try {
    const apiKeys = await listApiKeys();

    return NextResponse.json({
      success: true,
      data: apiKeys
    });
  } catch (error) {
    console.error('Failed to fetch API keys:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/resend/api-keys - Create a new API key
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, permission } = body;

    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: 'API key name is required'
        },
        { status: 400 }
      );
    }

    const newApiKey = await createApiKey({ name, permission });

    return NextResponse.json({
      success: true,
      data: newApiKey
    });
  } catch (error) {
    console.error('Failed to create API key:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/resend/api-keys - Delete an API key
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKeyId = searchParams.get('id');

    if (!apiKeyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'API key ID is required'
        },
        { status: 400 }
      );
    }

    await deleteApiKey(apiKeyId);

    return NextResponse.json({
      success: true,
      message: 'API key deleted successfully'
    });
  } catch (error) {
    console.error('Failed to delete API key:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
