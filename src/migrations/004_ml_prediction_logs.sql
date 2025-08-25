-- Migration: ML Prediction Logs Table
-- Phase 3.3: Predictive Analytics
-- Tracks ML model usage, performance, and requests for analytics and improvement

-- Drop table if exists (for development)
DROP TABLE IF EXISTS ml_prediction_logs;

-- Create ML prediction logs table
CREATE TABLE ml_prediction_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id TEXT NOT NULL,
    prediction_type TEXT NOT NULL CHECK (prediction_type IN ('revenue_forecast', 'churn_risk', 'lead_scoring')),
    
    -- Request parameters
    parameters JSONB NOT NULL DEFAULT '{}',
    
    -- Model performance metrics
    forecast_period INTEGER,
    data_points_used INTEGER,
    model_accuracy TEXT CHECK (model_accuracy IN ('high', 'medium', 'low')),
    confidence_score DECIMAL(5,4) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    
    -- Execution metrics
    processing_time_ms INTEGER NOT NULL,
    customers_analyzed INTEGER,
    at_risk_found INTEGER,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_ml_prediction_logs_tenant_id ON ml_prediction_logs(tenant_id);
CREATE INDEX idx_ml_prediction_logs_user_id ON ml_prediction_logs(user_id);
CREATE INDEX idx_ml_prediction_logs_prediction_type ON ml_prediction_logs(prediction_type);
CREATE INDEX idx_ml_prediction_logs_created_at ON ml_prediction_logs(created_at);
CREATE INDEX idx_ml_prediction_logs_model_accuracy ON ml_prediction_logs(model_accuracy);

-- Composite indexes for analytics queries
CREATE INDEX idx_ml_prediction_logs_tenant_type_created ON ml_prediction_logs(tenant_id, prediction_type, created_at);
CREATE INDEX idx_ml_prediction_logs_accuracy_confidence ON ml_prediction_logs(model_accuracy, confidence_score);

-- Add comments for documentation
COMMENT ON TABLE ml_prediction_logs IS 'Logs all ML prediction requests for performance monitoring and model improvement';
COMMENT ON COLUMN ml_prediction_logs.prediction_type IS 'Type of ML prediction: revenue_forecast, churn_risk, lead_scoring';
COMMENT ON COLUMN ml_prediction_logs.parameters IS 'JSON object containing request parameters and filters';
COMMENT ON COLUMN ml_prediction_logs.model_accuracy IS 'Assessed accuracy of the prediction model';
COMMENT ON COLUMN ml_prediction_logs.confidence_score IS 'Model confidence score (0-1)';
COMMENT ON COLUMN ml_prediction_logs.processing_time_ms IS 'Time taken to process the prediction request in milliseconds';

-- Row Level Security
ALTER TABLE ml_prediction_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access logs from their tenant
CREATE POLICY "Users can access prediction logs from their tenant" ON ml_prediction_logs
  FOR ALL USING (
    tenant_id IN (
      SELECT up.tenant_id 
      FROM user_profiles up 
      WHERE up.clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ml_prediction_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_ml_prediction_logs_updated_at
    BEFORE UPDATE ON ml_prediction_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_ml_prediction_logs_updated_at();

-- Grant permissions
GRANT SELECT, INSERT ON ml_prediction_logs TO authenticated;
GRANT USAGE ON SEQUENCE ml_prediction_logs_id_seq TO authenticated;

-- Create view for analytics dashboard
CREATE VIEW ml_prediction_analytics AS
SELECT 
    tenant_id,
    prediction_type,
    DATE_TRUNC('day', created_at) as prediction_date,
    COUNT(*) as total_requests,
    AVG(processing_time_ms) as avg_processing_time_ms,
    AVG(confidence_score) as avg_confidence,
    COUNT(CASE WHEN model_accuracy = 'high' THEN 1 END) as high_accuracy_count,
    COUNT(CASE WHEN model_accuracy = 'medium' THEN 1 END) as medium_accuracy_count,
    COUNT(CASE WHEN model_accuracy = 'low' THEN 1 END) as low_accuracy_count,
    SUM(COALESCE(customers_analyzed, 0)) as total_customers_analyzed,
    SUM(COALESCE(at_risk_found, 0)) as total_at_risk_found,
    AVG(COALESCE(data_points_used, 0)) as avg_data_points_used
FROM ml_prediction_logs
GROUP BY tenant_id, prediction_type, DATE_TRUNC('day', created_at);

-- Grant access to the analytics view
GRANT SELECT ON ml_prediction_analytics TO authenticated;

-- RLS for analytics view
ALTER VIEW ml_prediction_analytics SET (security_invoker = true);

-- Add indexes for the analytics view
CREATE INDEX idx_ml_prediction_analytics ON ml_prediction_logs(tenant_id, prediction_type, DATE_TRUNC('day', created_at));

-- Sample data for testing (optional - remove in production)
INSERT INTO ml_prediction_logs (
    tenant_id,
    user_id,
    prediction_type,
    parameters,
    forecast_period,
    data_points_used,
    model_accuracy,
    confidence_score,
    processing_time_ms,
    customers_analyzed,
    created_at
) VALUES 
(
    '123e4567-e89b-12d3-a456-426614174000'::uuid,
    'user_2example123456789',
    'revenue_forecast',
    '{"timeframe_days": 90, "forecast_days": 30, "confidence_level": 0.95}',
    30,
    90,
    'high',
    0.87,
    1250,
    NULL,
    NOW() - INTERVAL '2 days'
),
(
    '123e4567-e89b-12d3-a456-426614174000'::uuid,
    'user_2example123456789',
    'churn_risk',
    '{"risk_threshold": 0.5, "segment_filter": "all"}',
    NULL,
    150,
    'medium',
    0.75,
    2100,
    150,
    NOW() - INTERVAL '1 day'
);

-- Performance optimization: Partition table by created_at for large datasets (optional)
-- This would be implemented if the table grows very large
-- CREATE TABLE ml_prediction_logs_y2024m01 PARTITION OF ml_prediction_logs
-- FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');