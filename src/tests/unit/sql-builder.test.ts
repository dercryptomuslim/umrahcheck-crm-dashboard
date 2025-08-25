import { describe, it, expect } from 'vitest';
import { SQLQueryBuilder } from '@/lib/ai/sql-builder';
import type { QueryClassification } from '@/lib/ai/query-parser';

describe('SQLQueryBuilder', () => {
  const tenantId = '123e4567-e89b-12d3-a456-426614174000';
  const builder = new SQLQueryBuilder(tenantId);

  describe('Leads Queries', () => {
    it('should build basic leads list query', () => {
      const classification: QueryClassification = {
        type: 'leads',
        confidence: 0.9,
        intent: 'list',
        entities: {},
        filters: [],
        aggregation: undefined,
        timeframe: undefined
      };

      const result = builder.buildQuery(classification);

      expect(result.sql).toContain('SELECT');
      expect(result.sql).toContain('FROM contacts');
      expect(result.sql).toContain('WHERE c.tenant_id = $1');
      expect(result.params[0]).toBe(tenantId);
      expect(result.tables).toContain('contacts');
      expect(result.visualization_type).toBe('table');
    });

    it('should build leads count query', () => {
      const classification: QueryClassification = {
        type: 'leads',
        confidence: 0.9,
        intent: 'count',
        entities: {},
        filters: [],
        aggregation: 'count',
        timeframe: undefined
      };

      const result = builder.buildQuery(classification);

      expect(result.sql).toContain('COUNT(*)');
      expect(result.sql).toContain('total_leads');
      expect(result.visualization_type).toBe('metrics');
    });

    it('should apply lead score filters', () => {
      const classification: QueryClassification = {
        type: 'leads',
        confidence: 0.9,
        intent: 'list',
        entities: { leadStatus: 'hot' },
        filters: [
          {
            field: 'lead_score',
            operator: 'between',
            value: [70, 100]
          }
        ],
        aggregation: undefined,
        timeframe: undefined
      };

      const result = builder.buildQuery(classification);

      expect(result.sql).toContain('lead_score BETWEEN');
      expect(result.params).toContain(70);
      expect(result.params).toContain(100);
    });

    it('should apply country filters', () => {
      const classification: QueryClassification = {
        type: 'leads',
        confidence: 0.9,
        intent: 'list',
        entities: { country: 'Germany' },
        filters: [
          {
            field: 'country',
            operator: 'eq',
            value: 'Germany'
          }
        ],
        aggregation: undefined,
        timeframe: undefined
      };

      const result = builder.buildQuery(classification);

      expect(result.sql).toContain('country =');
      expect(result.params).toContain('Germany');
    });
  });

  describe('Bookings Queries', () => {
    it('should build basic bookings query', () => {
      const classification: QueryClassification = {
        type: 'bookings',
        confidence: 0.9,
        intent: 'list',
        entities: {},
        filters: [],
        aggregation: undefined,
        timeframe: undefined
      };

      const result = builder.buildQuery(classification);

      expect(result.sql).toContain('FROM bookings');
      expect(result.sql).toContain('JOIN contacts');
      expect(result.tables).toContain('bookings');
      expect(result.tables).toContain('contacts');
    });

    it('should build bookings count query', () => {
      const classification: QueryClassification = {
        type: 'bookings',
        confidence: 0.9,
        intent: 'count',
        entities: {},
        filters: [],
        aggregation: 'count',
        timeframe: undefined
      };

      const result = builder.buildQuery(classification);

      expect(result.sql).toContain('COUNT(*)');
      expect(result.sql).toContain('total_bookings');
      expect(result.visualization_type).toBe('metrics');
    });
  });

  describe('Revenue Queries', () => {
    it('should build revenue aggregation query', () => {
      const classification: QueryClassification = {
        type: 'revenue',
        confidence: 0.9,
        intent: 'sum',
        entities: {},
        filters: [],
        aggregation: 'sum',
        timeframe: undefined
      };

      const result = builder.buildQuery(classification);

      expect(result.sql).toContain('SUM(b.total_amount)');
      expect(result.sql).toContain('total_revenue');
      expect(result.sql).toContain('AVG(b.total_amount)');
      expect(result.sql).toContain('COUNT(*)');
      expect(result.visualization_type).toBe('metrics');
    });

    it('should exclude cancelled bookings from revenue', () => {
      const classification: QueryClassification = {
        type: 'revenue',
        confidence: 0.9,
        intent: 'sum',
        entities: {},
        filters: [],
        aggregation: 'sum',
        timeframe: undefined
      };

      const result = builder.buildQuery(classification);

      expect(result.sql).toContain("status != 'cancelled'");
    });
  });

  describe('Timeframe Handling', () => {
    it('should handle relative timeframes', () => {
      const startDate = new Date('2023-12-01');
      const endDate = new Date('2023-12-08');

      const classification: QueryClassification = {
        type: 'leads',
        confidence: 0.9,
        intent: 'list',
        entities: {},
        filters: [],
        aggregation: undefined,
        timeframe: {
          type: 'relative',
          start: startDate,
          end: endDate,
          period: 'week',
          count: 1
        }
      };

      const result = builder.buildQuery(classification);

      expect(result.sql).toContain('c.created_at >=');
      expect(result.params).toContain(startDate.toISOString());
    });

    it('should handle absolute timeframes', () => {
      const startDate = new Date('2023-12-01T00:00:00.000Z');
      const endDate = new Date('2023-12-01T23:59:59.999Z');

      const classification: QueryClassification = {
        type: 'bookings',
        confidence: 0.9,
        intent: 'list',
        entities: {},
        filters: [],
        aggregation: undefined,
        timeframe: {
          type: 'absolute',
          start: startDate,
          end: endDate
        }
      };

      const result = builder.buildQuery(classification);

      expect(result.sql).toContain('b.created_at BETWEEN');
      expect(result.params).toContain(startDate.toISOString());
      expect(result.params).toContain(endDate.toISOString());
    });
  });

  describe('Filter Clause Generation', () => {
    it('should handle equality filters', () => {
      const classification: QueryClassification = {
        type: 'contacts',
        confidence: 0.9,
        intent: 'list',
        entities: {},
        filters: [
          {
            field: 'country',
            operator: 'eq',
            value: 'Germany'
          }
        ],
        aggregation: undefined,
        timeframe: undefined
      };

      const result = builder.buildQuery(classification);

      expect(result.sql).toContain('country = $');
      expect(result.params).toContain('Germany');
    });

    it('should handle comparison filters', () => {
      const classification: QueryClassification = {
        type: 'contacts',
        confidence: 0.9,
        intent: 'list',
        entities: {},
        filters: [
          {
            field: 'budget_max',
            operator: 'gte',
            value: 5000
          }
        ],
        aggregation: undefined,
        timeframe: undefined
      };

      const result = builder.buildQuery(classification);

      expect(result.sql).toContain('budget_max >= $');
      expect(result.params).toContain(5000);
    });

    it('should handle like filters', () => {
      const classification: QueryClassification = {
        type: 'contacts',
        confidence: 0.9,
        intent: 'list',
        entities: {},
        filters: [
          {
            field: 'email',
            operator: 'like',
            value: '%@example.com'
          }
        ],
        aggregation: undefined,
        timeframe: undefined
      };

      const result = builder.buildQuery(classification);

      expect(result.sql).toContain('email ILIKE $');
      expect(result.params).toContain('%@example.com');
    });
  });

  describe('Analytics Queries', () => {
    it('should build analytics overview query', () => {
      const classification: QueryClassification = {
        type: 'analytics',
        confidence: 0.9,
        intent: 'analyze',
        entities: {},
        filters: [],
        aggregation: undefined,
        timeframe: undefined
      };

      const result = builder.buildQuery(classification);

      expect(result.sql).toContain('total_contacts');
      expect(result.sql).toContain('total_bookings');
      expect(result.sql).toContain('total_revenue');
      expect(result.sql).toContain('hot_leads');
      expect(result.visualization_type).toBe('metrics');
    });
  });

  describe('SQL Security Validation', () => {
    it('should reject dangerous SQL patterns', () => {
      const dangerousQueries = [
        'SELECT * FROM contacts; DROP TABLE contacts;',
        'SELECT * FROM contacts WHERE id = 1 UNION SELECT * FROM users',
        'SELECT * FROM contacts; DELETE FROM contacts',
        'UPDATE contacts SET email = "hacked"'
      ];

      dangerousQueries.forEach((sql) => {
        expect(builder.validateQuery(sql)).toBe(false);
      });
    });

    it('should accept safe SQL patterns', () => {
      const safeQueries = [
        'SELECT * FROM contacts WHERE tenant_id = $1',
        'SELECT COUNT(*) FROM bookings WHERE status = "confirmed"',
        'SELECT SUM(total_amount) FROM bookings GROUP BY currency'
      ];

      safeQueries.forEach((sql) => {
        expect(builder.validateQuery(sql)).toBe(true);
      });
    });
  });

  describe('Query Result Formatting', () => {
    it('should suggest appropriate visualization types', () => {
      const testCases = [
        { intent: 'count', expected: 'metrics' },
        { intent: 'sum', expected: 'metrics' },
        { intent: 'list', expected: 'table' },
        { intent: 'analyze', expected: 'metrics' }
      ];

      testCases.forEach(({ intent, expected }) => {
        const classification: QueryClassification = {
          type: 'leads',
          confidence: 0.9,
          intent,
          entities: {},
          filters: [],
          aggregation:
            intent === 'count' ? 'count' : intent === 'sum' ? 'sum' : undefined,
          timeframe: undefined
        };

        const result = builder.buildQuery(classification);
        expect(result.visualization_type).toBe(expected);
      });
    });

    it('should include expected columns for table views', () => {
      const classification: QueryClassification = {
        type: 'leads',
        confidence: 0.9,
        intent: 'list',
        entities: {},
        filters: [],
        aggregation: undefined,
        timeframe: undefined
      };

      const result = builder.buildQuery(classification);

      expect(result.expected_columns).toContain('first_name');
      expect(result.expected_columns).toContain('last_name');
      expect(result.expected_columns).toContain('email');
      expect(result.expected_columns).toContain('lead_score');
    });
  });
});
