import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { currentUser } from '@clerk/nextjs/server';

// Supabase client initialized per request for security

// Helper to get user context
async function getAuthContext() {
  const user = await currentUser();

  if (!user) {
    throw new Error('Unauthorized');
  }

  const tenantId = user.publicMetadata.tenant_id as string;
  const role = (user.publicMetadata.role as string) || 'agent';

  if (!tenantId) {
    throw new Error('No tenant associated with user');
  }

  return {
    userId: user.id,
    tenantId,
    role,
    email: user.emailAddresses[0]?.emailAddress
  };
}

// GET /api/ai/conversations/[id]/queries - Get queries for conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authContext = await getAuthContext();
    const resolvedParams = await params;
    const conversationId = resolvedParams.id;
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Verify conversation belongs to user
    const supabase = await createClient();
    const { data: conversation, error: convError } = await supabase
      .from('ai_conversations')
      .select('id, title')
      .eq('id', conversationId)
      .eq('tenant_id', authContext.tenantId)
      .eq('user_id', authContext.userId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json(
        { ok: false, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Fetch query history
    const { data: queries, error } = await supabase
      .from('ai_query_history')
      .select(
        `
        id,
        original_query,
        interpreted_query,
        query_type,
        result_count,
        processing_time_ms,
        confidence,
        status,
        error_message,
        created_at
      `
      )
      .eq('conversation_id', conversationId)
      .eq('tenant_id', authContext.tenantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error('Failed to fetch query history');
    }

    return NextResponse.json({
      ok: true,
      data: {
        conversation: {
          id: conversation.id,
          title: conversation.title
        },
        queries: queries || [],
        pagination: {
          limit,
          offset,
          total: queries?.length || 0,
          has_more: (queries?.length || 0) === limit
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        user_id: authContext.userId,
        tenant_id: authContext.tenantId
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Error logged: console.error('Query history error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch query history'
      },
      { status: 500 }
    );
  }
}
