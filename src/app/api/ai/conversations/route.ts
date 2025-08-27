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

// GET /api/ai/conversations - Get conversation history
export async function GET(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch conversations with query count
    const supabase = await createClient();
    const { data: conversations, error } = await supabase
      .from('ai_conversations')
      .select(
        `
        id,
        title,
        created_at,
        updated_at,
        context
      `
      )
      .eq('tenant_id', authContext.tenantId)
      .eq('user_id', authContext.userId)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error('Failed to fetch conversations');
    }

    // Get query counts for each conversation
    const conversationIds = conversations?.map((c) => c.id) || [];
    const { data: queryCounts } = await supabase
      .from('ai_query_history')
      .select('conversation_id')
      .in('conversation_id', conversationIds);

    // Build response with query counts and last query
    const enrichedConversations = await Promise.all(
      (conversations || []).map(async (conv) => {
        const queryCount =
          queryCounts?.filter((q) => q.conversation_id === conv.id).length || 0;

        // Get last query
        const { data: lastQuery } = await supabase
          .from('ai_query_history')
          .select('original_query, created_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return {
          id: conv.id,
          title: conv.title,
          created_at: conv.created_at,
          updated_at: conv.updated_at,
          query_count: queryCount,
          last_query: lastQuery?.original_query,
          last_query_at: lastQuery?.created_at
        };
      })
    );

    return NextResponse.json({
      ok: true,
      data: {
        conversations: enrichedConversations,
        pagination: {
          limit,
          offset,
          total: conversations?.length || 0,
          has_more: (conversations?.length || 0) === limit
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

    // Error will be logged by monitoring system via error response
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to fetch conversation history'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/ai/conversations - Delete conversation
export async function DELETE(request: NextRequest) {
  try {
    const authContext = await getAuthContext();
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('id');

    if (!conversationId) {
      return NextResponse.json(
        { ok: false, error: 'Conversation ID required' },
        { status: 400 }
      );
    }

    // Delete conversation (cascades to query history)
    const supabase = await createClient();
    const { error } = await supabase
      .from('ai_conversations')
      .delete()
      .eq('id', conversationId)
      .eq('tenant_id', authContext.tenantId)
      .eq('user_id', authContext.userId);

    if (error) {
      throw new Error('Failed to delete conversation');
    }

    return NextResponse.json({
      ok: true,
      data: {
        deleted_conversation_id: conversationId
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    // Error logged: console.error('Delete conversation error:', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Failed to delete conversation'
      },
      { status: 500 }
    );
  }
}
