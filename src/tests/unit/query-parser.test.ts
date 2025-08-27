import { describe, it, expect } from 'vitest';
import { NaturalLanguageQueryParser } from '@/lib/ai/query-parser';

describe('NaturalLanguageQueryParser', () => {
  const parser = new NaturalLanguageQueryParser();

  describe('Query Classification', () => {
    it('should classify leads queries correctly', () => {
      const result = parser.parseQuery(
        'Zeige mir alle heißen Leads aus Deutschland'

      expect(result.type).toBe('leads');
      expect(result.confidence).toBeGreaterThan(0.5);
      expect(result.intent).toBe('list');
      expect(result.entities.country).toBe('deutschland');
      expect(result.entities.leadStatus).toBe('hot');
    });

    it('should classify booking queries correctly', () => {
      const result = parser.parseQuery(
        'Wie viele Buchungen haben wir diesen Monat?'

      expect(result.type).toBe('bookings');
      expect(result.intent).toBe('count');
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('should classify revenue queries correctly', () => {
      const result = parser.parseQuery(
        'Welcher Umsatz wurde in den letzten 30 Tagen generiert?'

      expect(result.type).toBe('revenue');
      expect(result.intent).toBe('sum');
      expect(result.timeframe).toBeDefined();
      expect(result.timeframe?.count).toBe(30);
      expect(result.timeframe?.period).toBe('day');
    });

    it('should handle unknown queries gracefully', () => {
      const result = parser.parseQuery('Was ist das Wetter heute?');

      expect(result.type).toBe('unknown');
      expect(result.confidence).toBeLessThan(0.5);
    });
  });

  describe('Entity Extraction', () => {
    it('should extract country entities correctly', () => {
      const testCases = [
        { query: 'Leads aus Deutschland', expected: 'deutschland' },
        { query: 'customers from Switzerland', expected: 'schweiz' },
        { query: 'Kontakte aus Österreich', expected: 'österreich' }
      ];

      testCases.forEach(({ query, expected }) => {
        const result = parser.parseQuery(query);
        expect(result.entities.country).toBe(expected);
      });
    });

    it('should extract lead status entities correctly', () => {
      const testCases = [
        { query: 'heiße Leads', expected: 'hot' },
        { query: 'warme Interessenten', expected: 'warm' },
        { query: 'cold leads', expected: 'cold' }
      ];

      testCases.forEach(({ query, expected }) => {
        const result = parser.parseQuery(query);
        expect(result.entities.leadStatus).toBe(expected);
      });
    });

    it('should extract budget amounts correctly', () => {
      const result = parser.parseQuery('Kontakte mit Budget über 5000 Euro');

      expect(result.entities.budgetAmount).toBe(5000);
      expect(result.filters).toContainEqual(
        expect.objectContaining({
          field: 'budget_max',
          operator: 'gte',
          value: 5000
        })
    });
  });

  describe('Timeframe Extraction', () => {
    it('should extract relative timeframes correctly', () => {
      const testCases = [
        {
          query: 'Leads der letzten Woche',
          expectedPeriod: 'week',
          expectedCount: 1
        },
        {
          query: 'Buchungen der letzten 7 Tage',
          expectedPeriod: 'day',
          expectedCount: 7
        },
        {
          query: 'Umsatz der letzten 30 Tage',
          expectedPeriod: 'day',
          expectedCount: 30
        }
      ];

      testCases.forEach(({ query, expectedPeriod, expectedCount }) => {
        const result = parser.parseQuery(query);
        expect(result.timeframe).toBeDefined();
        expect(result.timeframe?.type).toBe('relative');
        expect(result.timeframe?.period).toBe(expectedPeriod);
        expect(result.timeframe?.count).toBe(expectedCount);
      });
    });

    it('should extract absolute timeframes correctly', () => {
      const result = parser.parseQuery('Leads von heute');

      expect(result.timeframe).toBeDefined();
      expect(result.timeframe?.type).toBe('absolute');
      expect(result.timeframe?.start).toBeInstanceOf(Date);
      expect(result.timeframe?.end).toBeInstanceOf(Date);
    });
  });

  describe('Filter Generation', () => {
    it('should generate correct filters for lead scores', () => {
      const result = parser.parseQuery('Zeige mir heiße Leads', 'leads');

      expect(result.filters).toContainEqual(
        expect.objectContaining({
          field: 'lead_score',
          operator: 'between',
          value: [70, 100]
        })
    });

    it('should generate country filters correctly', () => {
      const result = parser.parseQuery('Kontakte aus Deutschland');

      expect(result.filters).toContainEqual(
        expect.objectContaining({
          field: 'country',
          operator: 'eq',
          value: 'Germany'
        })
    });

    it('should handle multiple filters', () => {
      const result = parser.parseQuery(
        'Heiße Leads aus Deutschland mit Budget über 2000 Euro'

      expect(result.filters).toHaveLength(3);
      expect(result.filters).toContainEqual(
        expect.objectContaining({ field: 'lead_score' })
      expect(result.filters).toContainEqual(
        expect.objectContaining({ field: 'country' })
      expect(result.filters).toContainEqual(
        expect.objectContaining({ field: 'budget_max' })
    });
  });

  describe('Aggregation Detection', () => {
    it('should detect count aggregation', () => {
      const queries = [
        'Wie viele Leads haben wir?',
        'How many bookings this month?',
        'Anzahl der Kontakte'
      ];

      queries.forEach((query) => {
        const result = parser.parseQuery(query);
        expect(result.aggregation).toBe('count');
      });
    });

    it('should detect sum aggregation', () => {
      const queries = ['Summe des Umsatzes', 'Total revenue', 'Gesamtumsatz'];

      queries.forEach((query) => {
        const result = parser.parseQuery(query);
        expect(result.aggregation).toBe('sum');
      });
    });
  });

  describe('Confidence Scoring', () => {
    it('should give high confidence to clear, specific queries', () => {
      const result = parser.parseQuery(
        'Zeige mir alle heißen Leads aus Deutschland der letzten Woche'

      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('should give low confidence to vague queries', () => {
      const result = parser.parseQuery('Zeige mir etwas');

      expect(result.confidence).toBeLessThan(0.5);
    });

    it('should consider entity extraction in confidence', () => {
      const specificResult = parser.parseQuery(
        'Heiße Leads aus Deutschland mit 5000 Euro Budget'
      const vagueResult = parser.parseQuery('Zeige Leads');

      expect(specificResult.confidence).toBeGreaterThan(vagueResult.confidence);
    });
  });

  describe('Intent Recognition', () => {
    it('should recognize list intent', () => {
      const queries = [
        'Zeige mir Leads',
        'List all bookings',
        'Anzeigen aller Kontakte'
      ];

      queries.forEach((query) => {
        const result = parser.parseQuery(query);
        expect(result.intent).toBe('list');
      });
    });

    it('should recognize count intent', () => {
      const queries = [
        'Wie viele Leads?',
        'How many bookings?',
        'Anzahl der Kontakte'
      ];

      queries.forEach((query) => {
        const result = parser.parseQuery(query);
        expect(result.intent).toBe('count');
      });
    });

    it('should recognize analyze intent', () => {
      const queries = [
        'Analysiere die Performance',
        'Analyze the data',
        'Statistiken zeigen'
      ];

      queries.forEach((query) => {
        const result = parser.parseQuery(query);
        expect(result.intent).toBe('analyze');
      });
    });
  });
});
