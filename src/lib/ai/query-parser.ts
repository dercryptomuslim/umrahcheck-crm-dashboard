import { QUERY_PATTERNS } from '@/schemas/ai-query';
import type { QueryResult } from '@/schemas/ai-query';

// Query Classification Results
export interface QueryClassification {
  type: 'leads' | 'bookings' | 'revenue' | 'contacts' | 'analytics' | 'unknown';
  confidence: number;
  intent: string;
  entities: Record<string, any>;
  filters: QueryFilter[];
  aggregation?: 'count' | 'sum' | 'avg' | 'max' | 'min';
  timeframe?: TimeFrame;
}

export interface QueryFilter {
  field: string;
  operator:
    | 'eq'
    | 'ne'
    | 'gt'
    | 'lt'
    | 'gte'
    | 'lte'
    | 'like'
    | 'in'
    | 'between';
  value: any;
  table?: string;
}

export interface TimeFrame {
  type: 'relative' | 'absolute';
  start?: Date;
  end?: Date;
  period?: 'day' | 'week' | 'month' | 'year';
  count?: number;
}

export class NaturalLanguageQueryParser {
  private readonly timePatterns = {
    lastWeek: /(?:letzte[rn]?\s+woche|last\s+week|vergangene\s+woche)/i,
    lastMonth: /(?:letzte[rn]?\s+monat|last\s+month|vergangene[rn]?\s+monat)/i,
    thisMonth: /(?:diese[rn]?\s+monat|this\s+month|aktuelle[rn]?\s+monat)/i,
    lastYear: /(?:letzte[s]?\s+jahr|last\s+year|vergangene[s]?\s+jahr)/i,
    today: /(?:heute|today|heut)/i,
    yesterday: /(?:gestern|yesterday)/i,
    last7days:
      /(?:letzte[n]?\s+7\s+tag|last\s+7\s+days?|vergangene[n]?\s+7\s+tag)/i,
    last30days:
      /(?:letzte[n]?\s+30\s+tag|last\s+30\s+days?|vergangene[n]?\s+30\s+tag)/i,
    numberDays: /(?:letzte[n]?\s+(\d+)\s+tag|last\s+(\d+)\s+days?)/i
  };

  private readonly entityPatterns = {
    countries: {
      deutschland: ['deutschland', 'germany', 'german', 'de'],
      schweiz: ['schweiz', 'switzerland', 'swiss', 'ch'],
      österreich: ['österreich', 'austria', 'austrian', 'at'],
      türkei: ['türkei', 'turkey', 'turkish', 'tr']
    },
    leadStatus: {
      hot: ['heiß', 'heisse?', 'hot', 'sehr interessiert'],
      warm: ['warm', 'interessiert', 'interested'],
      cold: ['kalt', 'cold', 'uninteressiert']
    },
    budget: {
      luxury: ['luxury', 'luxus', '5000', 'premium'],
      high: ['hoch', 'high', '3000', '2000'],
      standard: ['standard', 'normal', '1000']
    },
    status: {
      cancelled: ['storniert', 'cancelled', 'abgesagt', 'refund'],
      confirmed: ['bestätigt', 'confirmed', 'gebucht'],
      pending: ['pending', 'wartend', 'offen']
    }
  };

  /**
   * Main parsing method - classifies query and extracts entities
   */
  public parseQuery(query: string, context?: string): QueryClassification {
    const normalizedQuery = query.toLowerCase().trim();

    // 1. Classify query type
    const queryType = this.classifyQueryType(normalizedQuery, context);

    // 2. Extract entities and filters
    const entities = this.extractEntities(normalizedQuery);
    const filters = this.extractFilters(normalizedQuery, queryType);
    const timeframe = this.extractTimeframe(normalizedQuery);
    const aggregation = this.extractAggregation(normalizedQuery);

    // 3. Determine intent
    const intent = this.determineIntent(normalizedQuery, queryType);

    // 4. Calculate confidence based on pattern matches and entity extraction
    const confidence = this.calculateConfidence(
      normalizedQuery,
      queryType,
      entities

    return {
      type: queryType,
      confidence,
      intent,
      entities,
      filters,
      aggregation,
      timeframe
    };
  }

  /**
   * Classify the type of query based on patterns
   */
  private classifyQueryType(
    query: string,
    context?: string
  ): QueryClassification['type'] {
    // If context is provided, prioritize it
    if (context && context !== 'analytics') {
      const contextPatterns =
        QUERY_PATTERNS[context as keyof typeof QUERY_PATTERNS];
      if (contextPatterns?.some((pattern) => pattern.test(query))) {
        return context as QueryClassification['type'];
      }
    }

    // Test patterns for each type
    for (const [type, patterns] of Object.entries(QUERY_PATTERNS)) {
      if (patterns.some((pattern) => pattern.test(query))) {
        return type as QueryClassification['type'];
      }
    }

    return 'unknown';
  }

  /**
   * Extract entities (countries, statuses, etc.) from query
   */
  private extractEntities(query: string): Record<string, any> {
    const entities: Record<string, any> = {};

    // Extract countries
    for (const [country, variations] of Object.entries(
      this.entityPatterns.countries
    )) {
      if (variations.some((variant) => query.includes(variant))) {
        entities.country = country;
        break;
      }
    }

    // Extract lead status
    for (const [status, variations] of Object.entries(
      this.entityPatterns.leadStatus
    )) {
      if (variations.some((variant) => query.includes(variant))) {
        entities.leadStatus = status;
        break;
      }
    }

    // Extract budget mentions
    const budgetMatch = query.match(/(\d+)(?:\s*(?:euro?|eur|€))?/i);
    if (budgetMatch) {
      entities.budgetAmount = parseInt(budgetMatch[1]);
    }

    // Extract status mentions
    for (const [status, variations] of Object.entries(
      this.entityPatterns.status
    )) {
      if (variations.some((variant) => query.includes(variant))) {
        entities.status = status;
        break;
      }
    }

    return entities;
  }

  /**
   * Extract filters based on query type and entities
   */
  private extractFilters(query: string, queryType: string): QueryFilter[] {
    const filters: QueryFilter[] = [];
    const entities = this.extractEntities(query);

    // Country filter
    if (entities.country) {
      filters.push({
        field: 'country',
        operator: 'eq',
        value:
          entities.country === 'deutschland'
            ? 'Germany'
            : entities.country === 'schweiz'
              ? 'Switzerland'
              : entities.country === 'österreich'
                ? 'Austria'
                : entities.country
      });
    }

    // Lead status filter (for leads queries)
    if (queryType === 'leads' && entities.leadStatus) {
      const scoreMap = { hot: [70, 100], warm: [40, 69], cold: [0, 39] };
      const range = scoreMap[entities.leadStatus as keyof typeof scoreMap];
      if (range) {
        filters.push({
          field: 'lead_score',
          operator: 'between',
          value: range
        });
      }
    }

    // Budget filter
    if (entities.budgetAmount) {
      filters.push({
        field: 'budget_max',
        operator: 'gte',
        value: entities.budgetAmount
      });
    }

    // Status filter (for bookings)
    if (queryType === 'bookings' && entities.status) {
      filters.push({
        field: 'status',
        operator: 'eq',
        value: entities.status
      });
    }

    return filters;
  }

  /**
   * Extract timeframe information
   */
  private extractTimeframe(query: string): TimeFrame | undefined {
    const now = new Date();

    if (this.timePatterns.today.test(query)) {
      return {
        type: 'absolute',
        start: new Date(now.setHours(0, 0, 0, 0)),
        end: new Date(now.setHours(23, 59, 59, 999))
      };
    }

    if (this.timePatterns.yesterday.test(query)) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      return {
        type: 'absolute',
        start: new Date(yesterday.setHours(0, 0, 0, 0)),
        end: new Date(yesterday.setHours(23, 59, 59, 999))
      };
    }

    if (this.timePatterns.lastWeek.test(query)) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);
      return {
        type: 'relative',
        start: weekStart,
        end: now,
        period: 'week',
        count: 1
      };
    }

    if (this.timePatterns.lastMonth.test(query)) {
      const monthStart = new Date(now);
      monthStart.setMonth(monthStart.getMonth() - 1);
      return {
        type: 'relative',
        start: monthStart,
        end: now,
        period: 'month',
        count: 1
      };
    }

    if (this.timePatterns.thisMonth.test(query)) {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      return {
        type: 'absolute',
        start: monthStart,
        end: now
      };
    }

    // Extract specific number of days
    const numberDaysMatch = query.match(this.timePatterns.numberDays);
    if (numberDaysMatch) {
      const days = parseInt(numberDaysMatch[1] || numberDaysMatch[2]);
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - days);
      return {
        type: 'relative',
        start: startDate,
        end: now,
        period: 'day',
        count: days
      };
    }

    return undefined;
  }

  /**
   * Extract aggregation type
   */
  private extractAggregation(
    query: string
  ): 'count' | 'sum' | 'avg' | 'max' | 'min' | undefined {
    if (/(?:wie viele|how many|anzahl|count)/i.test(query)) {
      return 'count';
    }
    if (/(?:summe|total|sum|gesamt)/i.test(query)) {
      return 'sum';
    }
    if (/(?:durchschnitt|average|avg|mittel)/i.test(query)) {
      return 'avg';
    }
    if (/(?:maximum|max|höchste)/i.test(query)) {
      return 'max';
    }
    if (/(?:minimum|min|niedrigste)/i.test(query)) {
      return 'min';
    }

    return undefined;
  }

  /**
   * Determine user intent
   */
  private determineIntent(query: string, queryType: string): string {
    const showPatterns = /(?:zeig|show|list|display|anzeig)/i;
    const countPatterns = /(?:wie viele|how many|count|anzahl)/i;
    const comparePatterns = /(?:vergleich|compare|unterschied|vs)/i;
    const analyzePatterns = /(?:analys|statistik|performance|trend)/i;

    if (countPatterns.test(query)) return 'count';
    if (comparePatterns.test(query)) return 'compare';
    if (analyzePatterns.test(query)) return 'analyze';
    if (showPatterns.test(query)) return 'list';

    // Default intents by query type
    const defaultIntents = {
      leads: 'list',
      bookings: 'list',
      revenue: 'sum',
      contacts: 'list',
      analytics: 'analyze'
    };

    return defaultIntents[queryType as keyof typeof defaultIntents] || 'list';
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(
    query: string,
    queryType: string,
    entities: Record<string, any>
  ): number {
    let confidence = 0.3; // Base confidence

    // Pattern match confidence
    if (queryType !== 'unknown') {
      confidence += 0.4;
    }

    // Entity extraction confidence
    const entityCount = Object.keys(entities).length;
    confidence += Math.min(entityCount * 0.1, 0.3);

    // Query completeness (has timeframe, filters, etc.)
    if (this.extractTimeframe(query)) confidence += 0.1;
    if (/\d/.test(query)) confidence += 0.05; // Has numbers
    if (query.length > 20) confidence += 0.05; // Detailed query

    return Math.min(Math.round(confidence * 100) / 100, 1.0);
  }
}

/**
 * Singleton instance
 */
export const queryParser = new NaturalLanguageQueryParser();
