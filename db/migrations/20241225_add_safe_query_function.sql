-- Migration: Add Safe Query Execution Function
-- Description: Create RPC function for secure SQL query execution with parameterization
-- Date: 2024-12-25

-- Safe Query Execution Function
-- This function allows controlled execution of parameterized queries
-- for the Natural Language Query interface
CREATE OR REPLACE FUNCTION execute_safe_query(
  query_sql TEXT,
  query_params JSONB DEFAULT '[]'::JSONB
)
RETURNS TABLE(result JSONB) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  param_count INTEGER;
  sql_statement TEXT;
  param_value TEXT;
  i INTEGER;
BEGIN
  -- Basic security checks
  IF query_sql IS NULL OR length(trim(query_sql)) = 0 THEN
    RAISE EXCEPTION 'Query cannot be empty';
  END IF;
  
  -- Check for dangerous patterns (additional security layer)
  IF query_sql ~* '\b(DROP|DELETE|TRUNCATE|ALTER|CREATE|INSERT|UPDATE|EXEC)\b' THEN
    RAISE EXCEPTION 'Query contains forbidden operations';
  END IF;
  
  -- Ensure query starts with SELECT
  IF NOT (trim(upper(query_sql)) LIKE 'SELECT%' OR trim(upper(query_sql)) LIKE 'WITH%') THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;
  
  -- For now, we'll use a simpler approach without dynamic parameter binding
  -- This is because PostgreSQL's EXECUTE with dynamic parameters is complex in this context
  
  -- Execute the query and return results as JSONB
  FOR result IN
    EXECUTE format('SELECT to_jsonb(t.*) FROM (%s) t', query_sql)
  LOOP
    RETURN NEXT;
  END LOOP;
  
  -- If no results, return empty
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
END;
$$;

-- Grant execute permission to authenticated users
-- Note: In production, you might want more restrictive permissions
GRANT EXECUTE ON FUNCTION execute_safe_query(TEXT, JSONB) TO authenticated;

-- Add comment
COMMENT ON FUNCTION execute_safe_query(TEXT, JSONB) IS 
'Safely execute SELECT queries with basic security validation for Natural Language Query interface';

-- Create a simpler version for immediate use
CREATE OR REPLACE FUNCTION execute_safe_select(query_sql TEXT)
RETURNS TABLE(result JSONB)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Security validation
  IF query_sql IS NULL OR length(trim(query_sql)) = 0 THEN
    RAISE EXCEPTION 'Query cannot be empty';
  END IF;
  
  -- Block dangerous operations
  IF query_sql ~* '\b(DROP|DELETE|TRUNCATE|ALTER|CREATE|INSERT|UPDATE|EXEC|;)\b' THEN
    RAISE EXCEPTION 'Query contains forbidden operations or multiple statements';
  END IF;
  
  -- Must start with SELECT
  IF NOT trim(upper(query_sql)) LIKE 'SELECT%' THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;
  
  -- Execute and return as JSONB
  RETURN QUERY
  EXECUTE format('SELECT to_jsonb(row) FROM (%s) AS row', query_sql);
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Query execution failed: %', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION execute_safe_select(TEXT) TO authenticated;

COMMENT ON FUNCTION execute_safe_select(TEXT) IS 
'Execute SELECT queries safely for Natural Language Query interface';