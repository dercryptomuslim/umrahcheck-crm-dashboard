import type {
  QueryClassification,
  QueryFilter,
  TimeFrame
} from './query-parser';
import type { QueryResult } from '@/schemas/ai-query';

export interface SQLQueryResult {
  sql: string;
  params: any[];
  tables: string[];
  visualization_type: 'table' | 'chart' | 'metrics' | 'list';
  expected_columns: string[];
}

export class SQLQueryBuilder {
  private readonly tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
  }

  /**
   * Build SQL query from classification
   */
  public buildQuery(classification: QueryClassification): SQLQueryResult {
    const { type, intent, filters, timeframe, aggregation } = classification;

    switch (type) {
      case 'leads':
        return this.buildLeadsQuery(intent, filters, timeframe, aggregation);
      case 'bookings':
        return this.buildBookingsQuery(intent, filters, timeframe, aggregation);
      case 'revenue':
        return this.buildRevenueQuery(intent, filters, timeframe, aggregation);
      case 'contacts':
        return this.buildContactsQuery(intent, filters, timeframe, aggregation);
      case 'analytics':
        return this.buildAnalyticsQuery(
          intent,
          filters,
          timeframe,
          aggregation
        );
      default:
        throw new Error(`Unsupported query type: ${type}`);
    }
  }

  /**
   * Build leads query
   */
  private buildLeadsQuery(
    intent: string,
    filters: QueryFilter[],
    timeframe?: TimeFrame,
    aggregation?: string
  ): SQLQueryResult {
    const params: any[] = [this.tenantId];
    let paramIndex = 2;

    let baseQuery = `
      SELECT 
        c.id,
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        c.country,
        c.city,
        c.lead_score,
        c.budget_min,
        c.budget_max,
        c.source,
        c.created_at,
        c.updated_at,
        COALESCE(em.last_activity_at, c.created_at) as last_activity
      FROM contacts c
      LEFT JOIN contact_engagement_metrics em ON c.id = em.contact_id
      WHERE c.tenant_id = $1
    `;

    const tables = ['contacts', 'contact_engagement_metrics'];

    // Apply filters
    for (const filter of filters) {
      baseQuery += ` AND ${this.buildFilterClause(filter, paramIndex)}`;
      params.push(filter.value);
      paramIndex++;
    }

    // Apply timeframe
    if (timeframe) {
      const timeClause = this.buildTimeClause(
        timeframe,
        'c.created_at',
        paramIndex
      );
      baseQuery += ` AND ${timeClause.clause}`;
      params.push(...timeClause.params);
      paramIndex += timeClause.params.length;
    }

    // Handle aggregation vs list
    if (intent === 'count' || aggregation === 'count') {
      baseQuery = `
        SELECT COUNT(*) as total_leads
        FROM contacts c
        WHERE c.tenant_id = $1
      `;

      // Reapply filters for count
      let countParamIndex = 2;
      for (const filter of filters) {
        baseQuery += ` AND ${this.buildFilterClause(filter, countParamIndex)}`;
        countParamIndex++;
      }

      if (timeframe) {
        const timeClause = this.buildTimeClause(
          timeframe,
          'c.created_at',
          countParamIndex
        );
        baseQuery += ` AND ${timeClause.clause}`;
      }

      return {
        sql: baseQuery,
        params,
        tables: ['contacts'],
        visualization_type: 'metrics',
        expected_columns: ['total_leads']
      };
    }

    // Default list query
    baseQuery += ' ORDER BY c.lead_score DESC, c.created_at DESC LIMIT 50';

    return {
      sql: baseQuery,
      params,
      tables,
      visualization_type: 'table',
      expected_columns: [
        'first_name',
        'last_name',
        'email',
        'lead_score',
        'country',
        'last_activity'
      ]
    };
  }

  /**
   * Build bookings query
   */
  private buildBookingsQuery(
    intent: string,
    filters: QueryFilter[],
    timeframe?: TimeFrame,
    aggregation?: string
  ): SQLQueryResult {
    const params: any[] = [this.tenantId];
    let paramIndex = 2;

    let baseQuery = `
      SELECT 
        b.id,
        b.contact_id,
        c.first_name,
        c.last_name,
        c.email,
        b.total_amount,
        b.currency,
        b.status,
        b.booking_date,
        b.travel_dates,
        b.created_at,
        b.updated_at
      FROM bookings b
      JOIN contacts c ON b.contact_id = c.id
      WHERE b.tenant_id = $1
    `;

    const tables = ['bookings', 'contacts'];

    // Apply filters
    for (const filter of filters) {
      const tablePrefix = filter.field === 'status' ? 'b.' : 'c.';
      baseQuery += ` AND ${tablePrefix}${this.buildFilterClause(filter, paramIndex)}`;
      params.push(filter.value);
      paramIndex++;
    }

    // Apply timeframe
    if (timeframe) {
      const timeClause = this.buildTimeClause(
        timeframe,
        'b.created_at',
        paramIndex
      );
      baseQuery += ` AND ${timeClause.clause}`;
      params.push(...timeClause.params);
      paramIndex += timeClause.params.length;
    }

    // Handle aggregation
    if (intent === 'count' || aggregation === 'count') {
      return {
        sql: `SELECT COUNT(*) as total_bookings FROM bookings WHERE tenant_id = $1`,
        params: [this.tenantId],
        tables: ['bookings'],
        visualization_type: 'metrics',
        expected_columns: ['total_bookings']
      };
    }

    baseQuery += ' ORDER BY b.created_at DESC LIMIT 50';

    return {
      sql: baseQuery,
      params,
      tables,
      visualization_type: 'table',
      expected_columns: [
        'first_name',
        'last_name',
        'total_amount',
        'status',
        'booking_date'
      ]
    };
  }

  /**
   * Build revenue query
   */
  private buildRevenueQuery(
    intent: string,
    filters: QueryFilter[],
    timeframe?: TimeFrame,
    aggregation?: string
  ): SQLQueryResult {
    const params: any[] = [this.tenantId];
    let paramIndex = 2;

    let baseQuery = `
      SELECT 
        SUM(b.total_amount) as total_revenue,
        COUNT(*) as booking_count,
        AVG(b.total_amount) as avg_booking_value,
        b.currency
      FROM bookings b
      WHERE b.tenant_id = $1 AND b.status != 'cancelled'
    `;

    // Apply timeframe
    if (timeframe) {
      const timeClause = this.buildTimeClause(
        timeframe,
        'b.created_at',
        paramIndex
      );
      baseQuery += ` AND ${timeClause.clause}`;
      params.push(...timeClause.params);
      paramIndex += timeClause.params.length;
    }

    baseQuery += ' GROUP BY b.currency';

    return {
      sql: baseQuery,
      params,
      tables: ['bookings'],
      visualization_type: 'metrics',
      expected_columns: [
        'total_revenue',
        'booking_count',
        'avg_booking_value',
        'currency'
      ]
    };
  }

  /**
   * Build contacts query
   */
  private buildContactsQuery(
    intent: string,
    filters: QueryFilter[],
    timeframe?: TimeFrame,
    aggregation?: string
  ): SQLQueryResult {
    const params: any[] = [this.tenantId];
    let paramIndex = 2;

    let baseQuery = `
      SELECT 
        c.id,
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        c.country,
        c.city,
        c.budget_min,
        c.budget_max,
        c.source,
        c.created_at
      FROM contacts c
      WHERE c.tenant_id = $1
    `;

    // Apply filters
    for (const filter of filters) {
      baseQuery += ` AND ${this.buildFilterClause(filter, paramIndex)}`;
      params.push(filter.value);
      paramIndex++;
    }

    // Apply timeframe
    if (timeframe) {
      const timeClause = this.buildTimeClause(
        timeframe,
        'c.created_at',
        paramIndex
      );
      baseQuery += ` AND ${timeClause.clause}`;
      params.push(...timeClause.params);
      paramIndex += timeClause.params.length;
    }

    if (intent === 'count' || aggregation === 'count') {
      return {
        sql: `SELECT COUNT(*) as total_contacts FROM contacts WHERE tenant_id = $1`,
        params: [this.tenantId],
        tables: ['contacts'],
        visualization_type: 'metrics',
        expected_columns: ['total_contacts']
      };
    }

    baseQuery += ' ORDER BY c.created_at DESC LIMIT 50';

    return {
      sql: baseQuery,
      params,
      tables: ['contacts'],
      visualization_type: 'table',
      expected_columns: [
        'first_name',
        'last_name',
        'email',
        'country',
        'budget_max'
      ]
    };
  }

  /**
   * Build analytics query
   */
  private buildAnalyticsQuery(
    intent: string,
    filters: QueryFilter[],
    timeframe?: TimeFrame,
    aggregation?: string
  ): SQLQueryResult {
    const params: any[] = [this.tenantId];

    // Default analytics overview
    const baseQuery = `
      SELECT 
        (SELECT COUNT(*) FROM contacts WHERE tenant_id = $1) as total_contacts,
        (SELECT COUNT(*) FROM bookings WHERE tenant_id = $1) as total_bookings,
        (SELECT SUM(total_amount) FROM bookings WHERE tenant_id = $1 AND status != 'cancelled') as total_revenue,
        (SELECT COUNT(*) FROM contacts WHERE tenant_id = $1 AND lead_score >= 70) as hot_leads
    `;

    return {
      sql: baseQuery,
      params,
      tables: ['contacts', 'bookings'],
      visualization_type: 'metrics',
      expected_columns: [
        'total_contacts',
        'total_bookings',
        'total_revenue',
        'hot_leads'
      ]
    };
  }

  /**
   * Build filter clause for WHERE conditions
   */
  private buildFilterClause(filter: QueryFilter, paramIndex: number): string {
    const { field, operator, value } = filter;

    switch (operator) {
      case 'eq':
        return `${field} = $${paramIndex}`;
      case 'ne':
        return `${field} != $${paramIndex}`;
      case 'gt':
        return `${field} > $${paramIndex}`;
      case 'lt':
        return `${field} < $${paramIndex}`;
      case 'gte':
        return `${field} >= $${paramIndex}`;
      case 'lte':
        return `${field} <= $${paramIndex}`;
      case 'like':
        return `${field} ILIKE $${paramIndex}`;
      case 'in':
        return `${field} = ANY($${paramIndex})`;
      case 'between':
        return `${field} BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      default:
        return `${field} = $${paramIndex}`;
    }
  }

  /**
   * Build time clause for date filtering
   */
  private buildTimeClause(
    timeframe: TimeFrame,
    column: string,
    paramIndex: number
  ): { clause: string; params: any[] } {
    if (timeframe.type === 'absolute' && timeframe.start && timeframe.end) {
      return {
        clause: `${column} BETWEEN $${paramIndex} AND $${paramIndex + 1}`,
        params: [timeframe.start.toISOString(), timeframe.end.toISOString()]
      };
    } else if (timeframe.type === 'relative' && timeframe.start) {
      return {
        clause: `${column} >= $${paramIndex}`,
        params: [timeframe.start.toISOString()]
      };
    }

    return { clause: '1=1', params: [] };
  }

  /**
   * Validate SQL query for security
   */
  public validateQuery(sql: string): boolean {
    const dangerousPatterns = [
      /drop\s+table/i,
      /delete\s+from/i,
      /truncate/i,
      /alter\s+table/i,
      /create\s+table/i,
      /insert\s+into/i,
      /update\s+.*set/i,
      /exec\s*\(/i,
      /union.*select/i,
      /;\s*--/i,
      /\/\*.*\*\//i
    ];

    return !dangerousPatterns.some((pattern) => pattern.test(sql));
  }
}
