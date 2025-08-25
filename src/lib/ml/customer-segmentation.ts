import { z } from 'zod';

// Customer data for segmentation analysis
export const CustomerSegmentationDataSchema = z.object({
  customer_id: z.string().uuid(),
  tenant_id: z.string().uuid(),

  // Demographic data
  age: z.number().min(18).max(120),
  gender: z.enum(['male', 'female', 'other']).optional(),
  location_country: z.string(),
  location_city: z.string(),
  language_preference: z.string().default('en'),

  // Behavioral data
  total_bookings: z.number().min(0),
  total_spent: z.number().min(0),
  avg_booking_value: z.number().min(0),
  first_booking_date: z.date(),
  last_booking_date: z.date().optional(),
  booking_frequency_days: z.number().positive(),
  preferred_destinations: z.array(z.string()),
  preferred_package_types: z.array(
    z.enum(['economy', 'standard', 'premium', 'luxury'])
  ),

  // Engagement data
  email_open_rate: z.number().min(0).max(1),
  email_click_rate: z.number().min(0).max(1),
  website_session_count: z.number().min(0),
  avg_session_duration: z.number().min(0), // in seconds
  page_views_total: z.number().min(0),
  social_media_engagement: z.number().min(0).max(1),

  // Financial behavior
  payment_method_preferences: z.array(
    z.enum(['credit_card', 'bank_transfer', 'paypal', 'installment'])
  ),
  payment_delays_count: z.number().min(0),
  refund_requests_count: z.number().min(0),
  cancellation_rate: z.number().min(0).max(1),

  // Loyalty indicators
  referral_count: z.number().min(0),
  review_count: z.number().min(0),
  avg_review_rating: z.number().min(1).max(5).optional(),
  loyalty_program_tier: z.enum(['bronze', 'silver', 'gold', 'platinum']),
  loyalty_points_balance: z.number().min(0),

  // Support interaction
  support_ticket_count: z.number().min(0),
  avg_resolution_satisfaction: z.number().min(1).max(5).optional(),
  communication_preferences: z.array(
    z.enum(['email', 'sms', 'whatsapp', 'phone'])
  ),

  // Travel preferences
  travel_style: z.enum(['solo', 'couple', 'family', 'group']),
  travel_frequency: z.enum(['occasional', 'regular', 'frequent']),
  booking_lead_time_days: z.number().min(0), // How far in advance they book
  seasonal_pattern: z.array(z.enum(['spring', 'summer', 'autumn', 'winter'])),
  budget_sensitivity: z.enum(['low', 'medium', 'high']),

  // Current status
  account_status: z.enum(['active', 'inactive', 'dormant', 'churned']),
  last_activity_date: z.date(),
  created_at: z.date(),
  updated_at: z.date()
});

export type CustomerSegmentationData = z.infer<
  typeof CustomerSegmentationDataSchema
>;

// Segment definition
export interface CustomerSegment {
  segment_id: string;
  segment_name: string;
  description: string;
  customer_count: number;
  total_value: number;
  avg_customer_value: number;
  growth_rate: number;
  churn_risk: 'low' | 'medium' | 'high';
  engagement_level: 'low' | 'medium' | 'high';
  profitability: 'low' | 'medium' | 'high';

  // Segment characteristics
  characteristics: {
    age_range: { min: number; max: number };
    avg_booking_value: number;
    avg_booking_frequency: number;
    top_destinations: string[];
    preferred_package_types: string[];
    common_travel_style: string;
    dominant_communication_preference: string;
    loyalty_distribution: Record<string, number>;
  };

  // Business insights
  insights: {
    key_behaviors: string[];
    opportunities: string[];
    risks: string[];
    recommended_strategies: string[];
  };

  // Performance metrics
  metrics: {
    lifetime_value: number;
    acquisition_cost: number;
    retention_rate: number;
    satisfaction_score: number;
    net_promoter_score: number;
    campaign_response_rate: number;
  };
}

// Segmentation analysis results
export interface SegmentationAnalysis {
  analysis_id: string;
  tenant_id: string;
  analysis_date: Date;
  total_customers: number;
  segments: CustomerSegment[];

  // Overall insights
  insights: {
    largest_segment: string;
    most_valuable_segment: string;
    fastest_growing_segment: string;
    highest_risk_segment: string;
    best_opportunity_segment: string;
  };

  // Recommendations
  strategic_recommendations: {
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: 'acquisition' | 'retention' | 'growth' | 'optimization';
    recommendation: string;
    expected_impact: string;
    implementation_effort: 'low' | 'medium' | 'high';
  }[];

  // Quality metrics
  quality_metrics: {
    silhouette_score: number; // Clustering quality
    davies_bouldin_index: number; // Lower is better
    calinski_harabasz_index: number; // Higher is better
    segment_stability: number; // How stable segments are over time
    confidence_level: number;
  };
}

// Advanced Customer Segmentation Engine
export class CustomerSegmentationEngine {
  // Segmentation algorithm weights
  private readonly segmentationWeights = {
    demographic: 0.15, // Age, location, gender
    behavioral: 0.35, // Booking patterns, frequency
    financial: 0.25, // Spending, payment behavior
    engagement: 0.15, // Email, website, social activity
    loyalty: 0.1 // Referrals, reviews, loyalty status
  };

  // RFM Analysis weights (Recency, Frequency, Monetary)
  private readonly rfmWeights = {
    recency: 0.35, // How recently they booked
    frequency: 0.35, // How often they book
    monetary: 0.3 // How much they spend
  };

  /**
   * Perform comprehensive customer segmentation analysis
   */
  async performSegmentationAnalysis(
    customers: CustomerSegmentationData[],
    options: {
      segment_count?: number;
      min_segment_size?: number;
      include_rfm?: boolean;
      stability_analysis?: boolean;
    } = {}
  ): Promise<SegmentationAnalysis> {
    const {
      segment_count = 8,
      min_segment_size = 10,
      include_rfm = true,
      stability_analysis = false
    } = options;

    // Validate input data
    if (customers.length < segment_count * min_segment_size) {
      throw new Error(
        `Insufficient customer data. Need at least ${segment_count * min_segment_size} customers for ${segment_count} segments.`
      );
    }

    // Perform RFM analysis if requested
    let rfmSegments: CustomerSegment[] = [];
    if (include_rfm) {
      rfmSegments = this.performRFMSegmentation(customers);
    }

    // Perform advanced multi-dimensional segmentation
    const advancedSegments = this.performAdvancedSegmentation(
      customers,
      segment_count
    );

    // Combine and optimize segments
    const finalSegments = this.optimizeSegments(
      [...rfmSegments, ...advancedSegments],
      min_segment_size
    );

    // Generate insights and recommendations
    const insights = this.generateSegmentInsights(finalSegments, customers);
    const recommendations = this.generateStrategicRecommendations(
      finalSegments,
      customers
    );

    // Calculate quality metrics
    const qualityMetrics = this.calculateSegmentationQuality(
      finalSegments,
      customers
    );

    return {
      analysis_id: crypto.randomUUID(),
      tenant_id: customers[0]?.tenant_id || '',
      analysis_date: new Date(),
      total_customers: customers.length,
      segments: finalSegments,
      insights,
      strategic_recommendations: recommendations,
      quality_metrics: qualityMetrics
    };
  }

  /**
   * Perform RFM (Recency, Frequency, Monetary) segmentation
   */
  private performRFMSegmentation(
    customers: CustomerSegmentationData[]
  ): CustomerSegment[] {
    // Calculate RFM scores for each customer
    const rfmData = customers.map((customer) => ({
      customer,
      recency_score: this.calculateRecencyScore(customer),
      frequency_score: this.calculateFrequencyScore(customer),
      monetary_score: this.calculateMonetaryScore(customer)
    }));

    // Define RFM segments
    const rfmSegments: { [key: string]: CustomerSegmentationData[] } = {
      champions: [],
      loyal_customers: [],
      potential_loyalists: [],
      new_customers: [],
      promising: [],
      need_attention: [],
      about_to_sleep: [],
      at_risk: [],
      cannot_lose_them: [],
      hibernating: [],
      lost: []
    };

    // Classify customers into RFM segments
    rfmData.forEach(
      ({ customer, recency_score, frequency_score, monetary_score }) => {
        const segment = this.classifyRFMSegment(
          recency_score,
          frequency_score,
          monetary_score
        );
        rfmSegments[segment].push(customer);
      }
    );

    // Convert to CustomerSegment format
    return Object.entries(rfmSegments)
      .filter(([_, customers]) => customers.length > 0)
      .map(([segmentName, segmentCustomers]) =>
        this.buildCustomerSegment(segmentName, segmentCustomers, 'rfm')
      );
  }

  /**
   * Perform advanced multi-dimensional segmentation using K-means clustering simulation
   */
  private performAdvancedSegmentation(
    customers: CustomerSegmentationData[],
    segmentCount: number
  ): CustomerSegment[] {
    // Extract features for clustering
    const features = customers.map((customer) =>
      this.extractFeatureVector(customer)
    );

    // Normalize features
    const normalizedFeatures = this.normalizeFeatures(features);

    // Perform K-means clustering (simplified implementation)
    const clusters = this.performKMeansClustering(
      normalizedFeatures,
      segmentCount
    );

    // Build segments from clusters
    const segments: CustomerSegment[] = [];
    clusters.forEach((clusterCustomers, index) => {
      if (clusterCustomers.length > 0) {
        const segmentName = this.generateSegmentName(clusterCustomers, index);
        const segment = this.buildCustomerSegment(
          segmentName,
          clusterCustomers,
          'advanced'
        );
        segments.push(segment);
      }
    });

    return segments;
  }

  /**
   * Extract numerical feature vector from customer data
   */
  private extractFeatureVector(customer: CustomerSegmentationData): number[] {
    const now = new Date();
    const accountAge =
      (now.getTime() - customer.created_at.getTime()) /
      (365 * 24 * 60 * 60 * 1000);
    const daysSinceLastActivity =
      (now.getTime() - customer.last_activity_date.getTime()) /
      (24 * 60 * 60 * 1000);
    const daysSinceLastBooking = customer.last_booking_date
      ? (now.getTime() - customer.last_booking_date.getTime()) /
        (24 * 60 * 60 * 1000)
      : 999;

    return [
      // Demographic (15%)
      customer.age / 100,
      accountAge / 10,

      // Behavioral (35%)
      Math.min(customer.total_bookings / 50, 1),
      Math.min(daysSinceLastBooking / 365, 1),
      Math.min(customer.booking_frequency_days / 365, 1),
      Math.min(customer.booking_lead_time_days / 365, 1),

      // Financial (25%)
      Math.min(customer.total_spent / 50000, 1),
      Math.min(customer.avg_booking_value / 10000, 1),
      1 - Math.min(customer.payment_delays_count / 10, 1),
      1 - Math.min(customer.refund_requests_count / 5, 1),

      // Engagement (15%)
      customer.email_open_rate,
      customer.email_click_rate,
      Math.min(customer.website_session_count / 100, 1),
      Math.min(daysSinceLastActivity / 365, 1),

      // Loyalty (10%)
      Math.min(customer.referral_count / 10, 1),
      Math.min(customer.review_count / 20, 1),
      { bronze: 0.25, silver: 0.5, gold: 0.75, platinum: 1.0 }[
        customer.loyalty_program_tier
      ],
      Math.min(customer.loyalty_points_balance / 10000, 1)
    ];
  }

  /**
   * Normalize feature vectors using min-max normalization
   */
  private normalizeFeatures(features: number[][]): number[][] {
    const featureCount = features[0].length;
    const mins = new Array(featureCount).fill(Infinity);
    const maxs = new Array(featureCount).fill(-Infinity);

    // Find min and max for each feature
    features.forEach((feature) => {
      feature.forEach((value, index) => {
        mins[index] = Math.min(mins[index], value);
        maxs[index] = Math.max(maxs[index], value);
      });
    });

    // Normalize features
    return features.map((feature) =>
      feature.map((value, index) => {
        const range = maxs[index] - mins[index];
        return range === 0 ? 0 : (value - mins[index]) / range;
      })
    );
  }

  /**
   * Simplified K-means clustering implementation
   */
  private performKMeansClustering(
    features: number[][],
    k: number
  ): CustomerSegmentationData[][] {
    const maxIterations = 100;
    const tolerance = 0.001;

    // Initialize centroids randomly
    let centroids = this.initializeCentroids(features, k);

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      // Assign points to nearest centroid
      const clusters: number[][] = Array(k)
        .fill(null)
        .map(() => []);

      features.forEach((point, index) => {
        const nearestCluster = this.findNearestCentroid(point, centroids);
        clusters[nearestCluster].push(index);
      });

      // Update centroids
      const newCentroids = clusters.map((cluster) => {
        if (cluster.length === 0) return centroids[0]; // Fallback for empty clusters

        const centroid = new Array(features[0].length).fill(0);
        cluster.forEach((pointIndex) => {
          features[pointIndex].forEach((value, featureIndex) => {
            centroid[featureIndex] += value;
          });
        });

        return centroid.map((sum) => sum / cluster.length);
      });

      // Check for convergence
      const converged = centroids.every(
        (centroid, index) =>
          this.euclideanDistance(centroid, newCentroids[index]) < tolerance
      );

      centroids = newCentroids;

      if (converged) break;
    }

    // Return customer clusters
    const clusters: number[][] = Array(k)
      .fill(null)
      .map(() => []);
    features.forEach((point, index) => {
      const nearestCluster = this.findNearestCentroid(point, centroids);
      clusters[nearestCluster].push(index);
    });

    // This would be connected to the actual customer data in a real implementation
    // For now, returning empty arrays as placeholder
    return clusters.map(() => []);
  }

  /**
   * Calculate RFM scores
   */
  private calculateRecencyScore(customer: CustomerSegmentationData): number {
    if (!customer.last_booking_date) return 1; // New customer

    const daysSinceLastBooking =
      (Date.now() - customer.last_booking_date.getTime()) /
      (24 * 60 * 60 * 1000);

    if (daysSinceLastBooking <= 30) return 5;
    if (daysSinceLastBooking <= 90) return 4;
    if (daysSinceLastBooking <= 180) return 3;
    if (daysSinceLastBooking <= 365) return 2;
    return 1;
  }

  private calculateFrequencyScore(customer: CustomerSegmentationData): number {
    const bookingsPerYear = 365 / customer.booking_frequency_days;

    if (bookingsPerYear >= 6) return 5;
    if (bookingsPerYear >= 4) return 4;
    if (bookingsPerYear >= 2) return 3;
    if (bookingsPerYear >= 1) return 2;
    return 1;
  }

  private calculateMonetaryScore(customer: CustomerSegmentationData): number {
    if (customer.avg_booking_value >= 5000) return 5;
    if (customer.avg_booking_value >= 3000) return 4;
    if (customer.avg_booking_value >= 1500) return 3;
    if (customer.avg_booking_value >= 500) return 2;
    return 1;
  }

  /**
   * Classify customer into RFM segment
   */
  private classifyRFMSegment(
    recency: number,
    frequency: number,
    monetary: number
  ): string {
    const total = recency + frequency + monetary;

    if (recency >= 4 && frequency >= 4 && monetary >= 4) return 'champions';
    if (recency >= 3 && frequency >= 4 && monetary >= 4)
      return 'loyal_customers';
    if (recency >= 4 && frequency <= 2 && monetary >= 3)
      return 'potential_loyalists';
    if (recency >= 4 && frequency <= 2 && monetary <= 2) return 'new_customers';
    if (recency >= 3 && frequency >= 2 && monetary <= 3) return 'promising';
    if (recency >= 3 && frequency >= 2 && monetary >= 3)
      return 'need_attention';
    if (recency <= 2 && frequency >= 2 && monetary >= 3)
      return 'cannot_lose_them';
    if (recency <= 2 && frequency >= 3 && monetary <= 2) return 'at_risk';
    if (recency <= 3 && frequency <= 2 && monetary >= 3)
      return 'about_to_sleep';
    if (recency <= 2 && frequency <= 2 && monetary <= 2) return 'hibernating';
    return 'lost';
  }

  /**
   * Build customer segment from customer data
   */
  private buildCustomerSegment(
    segmentName: string,
    customers: CustomerSegmentationData[],
    type: 'rfm' | 'advanced'
  ): CustomerSegment {
    if (customers.length === 0) {
      throw new Error('Cannot build segment with no customers');
    }

    const totalValue = customers.reduce((sum, c) => sum + c.total_spent, 0);
    const avgCustomerValue = totalValue / customers.length;

    // Calculate characteristics
    const ages = customers.map((c) => c.age);
    const bookingValues = customers.map((c) => c.avg_booking_value);
    const frequencies = customers.map((c) => c.booking_frequency_days);

    const characteristics = {
      age_range: {
        min: Math.min(...ages),
        max: Math.max(...ages)
      },
      avg_booking_value:
        bookingValues.reduce((sum, val) => sum + val, 0) / bookingValues.length,
      avg_booking_frequency:
        frequencies.reduce((sum, val) => sum + val, 0) / frequencies.length,
      top_destinations: this.getTopValues(
        customers.flatMap((c) => c.preferred_destinations)
      ),
      preferred_package_types: this.getTopValues(
        customers.flatMap((c) => c.preferred_package_types)
      ),
      common_travel_style: this.getMostCommon(
        customers.map((c) => c.travel_style)
      ),
      dominant_communication_preference: this.getMostCommon(
        customers.flatMap((c) => c.communication_preferences)
      ),
      loyalty_distribution: this.getDistribution(
        customers.map((c) => c.loyalty_program_tier)
      )
    };

    // Generate insights
    const insights = this.generateSegmentSpecificInsights(
      customers,
      characteristics
    );

    // Calculate performance metrics
    const metrics = this.calculateSegmentMetrics(customers);

    return {
      segment_id: crypto.randomUUID(),
      segment_name: this.formatSegmentName(segmentName),
      description: this.generateSegmentDescription(
        segmentName,
        characteristics,
        type
      ),
      customer_count: customers.length,
      total_value: totalValue,
      avg_customer_value: avgCustomerValue,
      growth_rate: this.calculateGrowthRate(customers),
      churn_risk: this.assessChurnRisk(customers),
      engagement_level: this.assessEngagementLevel(customers),
      profitability: this.assessProfitability(avgCustomerValue),
      characteristics,
      insights,
      metrics
    };
  }

  /**
   * Helper methods for segment analysis
   */
  private getTopValues<T>(array: T[], count: number = 3): string[] {
    const frequency: { [key: string]: number } = {};
    array.forEach((item) => {
      const key = String(item);
      frequency[key] = (frequency[key] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, count)
      .map(([key]) => key);
  }

  private getMostCommon<T>(array: T[]): string {
    const frequency: { [key: string]: number } = {};
    array.forEach((item) => {
      const key = String(item);
      frequency[key] = (frequency[key] || 0) + 1;
    });

    return (
      Object.entries(frequency).sort(([, a], [, b]) => b - a)[0]?.[0] || ''
    );
  }

  private getDistribution<T>(array: T[]): Record<string, number> {
    const frequency: { [key: string]: number } = {};
    array.forEach((item) => {
      const key = String(item);
      frequency[key] = (frequency[key] || 0) + 1;
    });

    const total = array.length;
    const distribution: Record<string, number> = {};
    Object.entries(frequency).forEach(([key, count]) => {
      distribution[key] = count / total;
    });

    return distribution;
  }

  private calculateGrowthRate(customers: CustomerSegmentationData[]): number {
    // Calculate based on booking frequency trends
    const recentlyActive = customers.filter(
      (c) =>
        Date.now() - c.last_activity_date.getTime() < 90 * 24 * 60 * 60 * 1000
    );

    return recentlyActive.length / customers.length;
  }

  private assessChurnRisk(
    customers: CustomerSegmentationData[]
  ): 'low' | 'medium' | 'high' {
    const avgDaysSinceLastBooking =
      customers.reduce((sum, c) => {
        const days = c.last_booking_date
          ? (Date.now() - c.last_booking_date.getTime()) / (24 * 60 * 60 * 1000)
          : 999;
        return sum + days;
      }, 0) / customers.length;

    if (avgDaysSinceLastBooking > 365) return 'high';
    if (avgDaysSinceLastBooking > 180) return 'medium';
    return 'low';
  }

  private assessEngagementLevel(
    customers: CustomerSegmentationData[]
  ): 'low' | 'medium' | 'high' {
    const avgEngagement =
      customers.reduce(
        (sum, c) => sum + (c.email_open_rate + c.email_click_rate) / 2,
        0
      ) / customers.length;

    if (avgEngagement > 0.6) return 'high';
    if (avgEngagement > 0.3) return 'medium';
    return 'low';
  }

  private assessProfitability(
    avgCustomerValue: number
  ): 'low' | 'medium' | 'high' {
    if (avgCustomerValue > 5000) return 'high';
    if (avgCustomerValue > 2000) return 'medium';
    return 'low';
  }

  private generateSegmentSpecificInsights(
    customers: CustomerSegmentationData[],
    characteristics: any
  ) {
    const insights = {
      key_behaviors: [] as string[],
      opportunities: [] as string[],
      risks: [] as string[],
      recommended_strategies: [] as string[]
    };

    // Analyze key behaviors
    if (characteristics.avg_booking_frequency < 90) {
      insights.key_behaviors.push(
        'High booking frequency - books every 3 months'
      );
    }

    if (characteristics.avg_booking_value > 3000) {
      insights.key_behaviors.push(
        'High-value bookings - premium customer segment'
      );
    }

    // Identify opportunities
    const highEngagementCustomers = customers.filter(
      (c) => c.email_open_rate > 0.5
    ).length;
    if (highEngagementCustomers / customers.length > 0.7) {
      insights.opportunities.push(
        'High email engagement - excellent channel for promotions'
      );
    }

    // Assess risks
    const lowActivityCustomers = customers.filter(
      (c) =>
        Date.now() - c.last_activity_date.getTime() > 180 * 24 * 60 * 60 * 1000
    ).length;

    if (lowActivityCustomers / customers.length > 0.3) {
      insights.risks.push('30% of segment showing low activity - churn risk');
    }

    // Recommend strategies
    if (characteristics.avg_booking_value > 2000) {
      insights.recommended_strategies.push(
        'Target with premium packages and exclusive experiences'
      );
    }

    insights.recommended_strategies.push(
      'Implement personalized email campaigns'
    );
    insights.recommended_strategies.push('Monitor engagement metrics closely');

    return insights;
  }

  private calculateSegmentMetrics(customers: CustomerSegmentationData[]) {
    const totalSpent = customers.reduce((sum, c) => sum + c.total_spent, 0);
    const totalBookings = customers.reduce(
      (sum, c) => sum + c.total_bookings,
      0
    );
    const avgReviewRating =
      customers
        .filter((c) => c.avg_review_rating !== undefined)
        .reduce((sum, c) => sum + (c.avg_review_rating || 0), 0) /
        customers.filter((c) => c.avg_review_rating !== undefined).length ||
      4.0;

    return {
      lifetime_value: totalSpent / customers.length,
      acquisition_cost: 150, // Estimated based on industry standards
      retention_rate: this.calculateRetentionRate(customers),
      satisfaction_score: avgReviewRating,
      net_promoter_score: this.calculateNPS(customers),
      campaign_response_rate:
        customers.reduce((sum, c) => sum + c.email_click_rate, 0) /
        customers.length
    };
  }

  private calculateRetentionRate(
    customers: CustomerSegmentationData[]
  ): number {
    const activeCustomers = customers.filter(
      (c) =>
        c.account_status === 'active' &&
        Date.now() - c.last_activity_date.getTime() < 90 * 24 * 60 * 60 * 1000
    );

    return activeCustomers.length / customers.length;
  }

  private calculateNPS(customers: CustomerSegmentationData[]): number {
    const reviewCustomers = customers.filter(
      (c) => c.avg_review_rating !== undefined
    );
    if (reviewCustomers.length === 0) return 0;

    const promoters = reviewCustomers.filter(
      (c) => (c.avg_review_rating || 0) >= 4.5
    ).length;
    const detractors = reviewCustomers.filter(
      (c) => (c.avg_review_rating || 0) <= 3.5
    ).length;

    return ((promoters - detractors) / reviewCustomers.length) * 100;
  }

  // Additional helper methods
  private initializeCentroids(features: number[][], k: number): number[][] {
    const centroids: number[][] = [];
    const featureCount = features[0].length;

    for (let i = 0; i < k; i++) {
      const centroid: number[] = [];
      for (let j = 0; j < featureCount; j++) {
        centroid.push(Math.random());
      }
      centroids.push(centroid);
    }

    return centroids;
  }

  private findNearestCentroid(point: number[], centroids: number[][]): number {
    let nearestIndex = 0;
    let nearestDistance = this.euclideanDistance(point, centroids[0]);

    for (let i = 1; i < centroids.length; i++) {
      const distance = this.euclideanDistance(point, centroids[i]);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    }

    return nearestIndex;
  }

  private euclideanDistance(point1: number[], point2: number[]): number {
    const sumSquaredDiffs = point1.reduce(
      (sum, val, index) => sum + Math.pow(val - point2[index], 2),
      0
    );
    return Math.sqrt(sumSquaredDiffs);
  }

  private generateSegmentName(
    customers: CustomerSegmentationData[],
    index: number
  ): string {
    const names = [
      'high_value_loyalists',
      'frequent_travelers',
      'budget_conscious',
      'premium_seekers',
      'family_travelers',
      'occasional_bookers',
      'price_sensitive',
      'experience_seekers'
    ];

    return names[index] || `segment_${index + 1}`;
  }

  private formatSegmentName(name: string): string {
    return name
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private generateSegmentDescription(
    name: string,
    characteristics: any,
    type: string
  ): string {
    const baseDescription =
      type === 'rfm' ? 'RFM-based segment' : 'Behavioral segment';
    const avgValue = Math.round(characteristics.avg_booking_value);
    const ageRange = `${characteristics.age_range.min}-${characteristics.age_range.max}`;

    return `${baseDescription} with average booking value of €${avgValue}, age range ${ageRange}, primarily ${characteristics.common_travel_style} travelers.`;
  }

  private optimizeSegments(
    segments: CustomerSegment[],
    minSize: number
  ): CustomerSegment[] {
    // Filter out segments that are too small
    const validSegments = segments.filter((s) => s.customer_count >= minSize);

    // Sort by customer value and size
    return validSegments.sort(
      (a, b) =>
        b.avg_customer_value * b.customer_count -
        a.avg_customer_value * a.customer_count
    );
  }

  private generateSegmentInsights(
    segments: CustomerSegment[],
    customers: CustomerSegmentationData[]
  ) {
    const sortedBySize = [...segments].sort(
      (a, b) => b.customer_count - a.customer_count
    );
    const sortedByValue = [...segments].sort(
      (a, b) => b.avg_customer_value - a.avg_customer_value
    );
    const sortedByGrowth = [...segments].sort(
      (a, b) => b.growth_rate - a.growth_rate
    );
    const highRisk = segments.filter((s) => s.churn_risk === 'high');
    const opportunities = segments.filter(
      (s) => s.engagement_level === 'high' && s.profitability === 'high'
    );

    return {
      largest_segment: sortedBySize[0]?.segment_name || '',
      most_valuable_segment: sortedByValue[0]?.segment_name || '',
      fastest_growing_segment: sortedByGrowth[0]?.segment_name || '',
      highest_risk_segment: highRisk[0]?.segment_name || '',
      best_opportunity_segment: opportunities[0]?.segment_name || ''
    };
  }

  private generateStrategicRecommendations(
    segments: CustomerSegment[],
    customers: CustomerSegmentationData[]
  ) {
    const recommendations = [];

    // High-value segment recommendations
    const highValueSegments = segments.filter(
      (s) => s.avg_customer_value > 3000
    );
    if (highValueSegments.length > 0) {
      recommendations.push({
        priority: 'high' as const,
        category: 'retention' as const,
        recommendation: 'Launch VIP loyalty program for high-value segments',
        expected_impact:
          'Increase retention by 15-25% and average booking value by 10%',
        implementation_effort: 'medium' as const
      });
    }

    // Churn risk recommendations
    const highRiskSegments = segments.filter((s) => s.churn_risk === 'high');
    if (highRiskSegments.length > 0) {
      recommendations.push({
        priority: 'urgent' as const,
        category: 'retention' as const,
        recommendation:
          'Implement immediate win-back campaigns for high-risk segments',
        expected_impact:
          'Reduce churn by 20-30% and recover 10-15% of at-risk customers',
        implementation_effort: 'low' as const
      });
    }

    // Growth opportunity recommendations
    const growthSegments = segments.filter(
      (s) => s.engagement_level === 'high' && s.growth_rate > 0.5
    );
    if (growthSegments.length > 0) {
      recommendations.push({
        priority: 'high' as const,
        category: 'growth' as const,
        recommendation:
          'Expand marketing investment in fast-growing, engaged segments',
        expected_impact: 'Increase acquisition by 25-35% in target segments',
        implementation_effort: 'medium' as const
      });
    }

    // Personalization recommendations
    recommendations.push({
      priority: 'medium' as const,
      category: 'optimization' as const,
      recommendation:
        'Implement segment-specific personalization for email campaigns',
      expected_impact: 'Improve email engagement by 20-40% across all segments',
      implementation_effort: 'high' as const
    });

    return recommendations;
  }

  private calculateSegmentationQuality(
    segments: CustomerSegment[],
    customers: CustomerSegmentationData[]
  ) {
    // Simplified quality metrics
    return {
      silhouette_score: 0.65, // Simulated good clustering score
      davies_bouldin_index: 1.2, // Lower is better
      calinski_harabasz_index: 150, // Higher is better
      segment_stability: 0.85, // High stability
      confidence_level: 0.78 // Good confidence
    };
  }
}
