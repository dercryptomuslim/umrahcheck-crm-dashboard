-- Migration: Add AI Conversations and Query History Tables
-- Description: Support for Natural Language Query Interface with conversation history
-- Date: 2024-12-25

-- AI Conversations Table
CREATE TABLE ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  title TEXT,
  context TEXT DEFAULT 'nl_query',
  
  -- Indexes
  CONSTRAINT ai_conversations_context_check CHECK (context IN ('nl_query', 'chat_support', 'analytics'))
);

-- Query History Table
CREATE TABLE ai_query_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES ai_conversations(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  original_query TEXT NOT NULL,
  interpreted_query TEXT,
  query_type TEXT,
  sql_query TEXT,
  result_count INTEGER DEFAULT 0,
  processing_time_ms INTEGER DEFAULT 0,
  confidence DECIMAL(3,2) DEFAULT 0.5,
  status TEXT DEFAULT 'completed',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT ai_query_history_status_check CHECK (status IN ('processing', 'completed', 'failed')),
  CONSTRAINT ai_query_history_confidence_check CHECK (confidence >= 0.0 AND confidence <= 1.0)
);

-- Create indexes for performance
CREATE INDEX idx_ai_conversations_tenant_user ON ai_conversations(tenant_id, user_id);
CREATE INDEX idx_ai_conversations_updated_at ON ai_conversations(updated_at DESC);
CREATE INDEX idx_ai_query_history_conversation ON ai_query_history(conversation_id);
CREATE INDEX idx_ai_query_history_tenant_user ON ai_query_history(tenant_id, user_id);
CREATE INDEX idx_ai_query_history_created_at ON ai_query_history(created_at DESC);
CREATE INDEX idx_ai_query_history_query_type ON ai_query_history(query_type);

-- Enable Row Level Security
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_query_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_conversations
CREATE POLICY "Users can view own conversations" ON ai_conversations
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenant_roles 
      WHERE user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can create conversations in their tenant" ON ai_conversations
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_tenant_roles 
      WHERE user_id = auth.jwt() ->> 'sub'
    )
    AND user_id = auth.jwt() ->> 'sub'
  );

CREATE POLICY "Users can update own conversations" ON ai_conversations
  FOR UPDATE USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenant_roles 
      WHERE user_id = auth.jwt() ->> 'sub'
    )
    AND user_id = auth.jwt() ->> 'sub'
  );

-- RLS Policies for ai_query_history
CREATE POLICY "Users can view own query history" ON ai_query_history
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM user_tenant_roles 
      WHERE user_id = auth.jwt() ->> 'sub'
    )
  );

CREATE POLICY "Users can create query history in their tenant" ON ai_query_history
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_tenant_roles 
      WHERE user_id = auth.jwt() ->> 'sub'
    )
    AND user_id = auth.jwt() ->> 'sub'
  );

-- Update function for conversations
CREATE OR REPLACE FUNCTION update_ai_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_conversations_updated_at
  BEFORE UPDATE ON ai_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_conversation_updated_at();

-- Add comments for documentation
COMMENT ON TABLE ai_conversations IS 'AI-powered conversation sessions for natural language queries';
COMMENT ON TABLE ai_query_history IS 'History of natural language queries with results and metadata';
COMMENT ON COLUMN ai_conversations.context IS 'Type of AI conversation: nl_query, chat_support, analytics';
COMMENT ON COLUMN ai_query_history.query_type IS 'Classified query type: leads, bookings, revenue, contacts, analytics';
COMMENT ON COLUMN ai_query_history.confidence IS 'AI confidence score for query interpretation (0.0-1.0)';