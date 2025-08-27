import { z } from 'zod';

// Customer profile for recommendation analysis
export const CustomerProfileSchema = z.object({
  customer_id: z.string().uuid(),
  age: z.number().min(18).max(120),
  location: z.string(),
  preferred_destinations: z.array(z.string()),
  booking_history: z.array(
    z.object({
      destination: z.string(),
      package_type: z.enum(['economy', 'standard', 'premium', 'luxury']),
      price: z.number().positive(),
      booking_date: z.date(),
      satisfaction_score: z.number().min(1).max(5).optional()
    })
  ),
  total_spent: z.number().min(0),
  avg_booking_value: z.number().min(0),
  booking_frequency_days: z.number().positive(),
  last_booking_days_ago: z.number().min(0),
  email_preferences: z.object({
    promotions: z.boolean(),
    newsletters: z.boolean(),
    recommendations: z.boolean()
  }),
  engagement_score: z.number().min(0).max(1),
  loyalty_tier: z.enum(['bronze', 'silver', 'gold', 'platinum']),
  communication_preference: z.enum(['email', 'sms', 'whatsapp', 'phone']),
  budget_range: z.enum(['budget', 'mid-range', 'premium', 'luxury']),
  travel_style: z.enum(['solo', 'family', 'group', 'couple']),
  seasonal_preferences: z.array(
    z.enum(['spring', 'summer', 'autumn', 'winter'])
  )
});

export type CustomerProfile = z.infer<typeof CustomerProfileSchema>;

// Recommendation types
export interface ProductRecommendation {
  product_id: string;
  product_name: string;
  product_type: 'package' | 'service' | 'upgrade' | 'addon';
  destination: string;
  price: number;
  confidence_score: number;
  reasoning: string[];
  expected_conversion_rate: number;
  expected_revenue: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  validity_days: number;
  personalization_factors: string[];
  cross_sell_potential: number;
  up_sell_potential: number;
}

export interface CampaignRecommendation {
  campaign_id: string;
  campaign_name: string;
  campaign_type: 'email' | 'sms' | 'push' | 'whatsapp';
  target_segment: string;
  message_template: string;
  call_to_action: string;
  confidence_score: number;
  expected_open_rate: number;
  expected_click_rate: number;
  expected_conversion_rate: number;
  optimal_send_time: {
    day_of_week: number; // 0 = Sunday
    hour: number; // 0-23
    timezone: string;
  };
  urgency_level: 'low' | 'medium' | 'high' | 'critical';
  personalization_tokens: Record<string, string>;
  a_b_test_variant?: string;
}

export interface SegmentInsight {
  segment_id: string;
  segment_name: string;
  customer_count: number;
  characteristics: string[];
  value_score: number;
  growth_potential: number;
  recommended_actions: string[];
  success_probability: number;
  expected_roi: number;
}

export interface RecommendationSummary {
  total_recommendations: number;
  high_priority_count: number;
  expected_total_revenue: number;
  avg_confidence_score: number;
  top_opportunities: {
    product_recommendations: number;
    campaign_recommendations: number;
    cross_sell_opportunities: number;
    up_sell_opportunities: number;
  };
  segment_breakdown: {
    [segment: string]: {
      count: number;
      expected_revenue: number;
      avg_confidence: number;
    };
  };
}

// Smart Recommendations Engine using collaborative filtering + content-based approach
export class SmartRecommendationsEngine {
  // Feature weights for recommendation scoring
  private readonly featureWeights = {
    behavioral_similarity: 0.25, // Similar customers' preferences
    content_similarity: 0.2, // Similar products/destinations
    temporal_patterns: 0.15, // Seasonal/timing patterns
    value_alignment: 0.15, // Price/budget alignment
    engagement_history: 0.1, // Past engagement levels
    conversion_likelihood: 0.1, // Likelihood to convert
    loyalty_factor: 0.05 // Loyalty tier influence
  };

  // Customer segmentation weights
  private readonly segmentWeights = {
    demographic: 0.25, // Age, location, travel style
    behavioral: 0.3, // Booking patterns, engagement
    value: 0.25, // Spending patterns, LTV
    lifecycle: 0.2 // Account age, frequency, recency
  };

  /**
   * Generate personalized product recommendations for a customer
   */
  async generateProductRecommendations(
    profile: CustomerProfile,
    availableProducts: any[],
    options: {
      max_recommendations?: number;
      min_confidence?: number;
      include_cross_sell?: boolean;
      include_up_sell?: boolean;
      exclude_recent?: boolean;
    } = {}
  ): Promise<ProductRecommendation[]> {
    const {
      max_recommendations = 10,
      min_confidence = 0.3,
      include_cross_sell = true,
      include_up_sell = true,
      exclude_recent = true
    } = options;

    const recommendations: ProductRecommendation[] = [];

    for (const product of availableProducts) {
      // Skip recently viewed/purchased products if requested
      if (exclude_recent && this.wasRecentlyInteracted(profile, product)) {
        continue;
      }

      const confidence = this.calculateProductConfidence(profile, product);

      if (confidence < min_confidence) {
        continue;
      }

      const recommendation: ProductRecommendation = {
        product_id: product.id,
        product_name: product.name,
        product_type: product.type,
        destination: product.destination,
        price: product.price,
        confidence_score: confidence,
        reasoning: this.generateProductReasoning(profile, product, confidence),
        expected_conversion_rate: this.estimateConversionRate(
          profile,
          product,
          confidence
        ),
        expected_revenue:
          product.price *
          this.estimateConversionRate(profile, product, confidence),
        priority: this.determinePriority(confidence, product.price),
        validity_days: this.calculateValidityPeriod(profile, product),
        personalization_factors: this.identifyPersonalizationFactors(
          profile,
          product
        ),
        cross_sell_potential: include_cross_sell
          ? this.calculateCrossSellPotential(profile, product)
          : 0,
        up_sell_potential: include_up_sell
          ? this.calculateUpSellPotential(profile, product)
          : 0
      };

      recommendations.push(recommendation);
    }

    // Sort by priority and confidence, return top N
    return recommendations
      .sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff =
          priorityOrder[b.priority] - priorityOrder[a.priority];
        return priorityDiff !== 0
          ? priorityDiff
          : b.confidence_score - a.confidence_score;
      })
      .slice(0, max_recommendations);
  }

  /**
   * Generate personalized campaign recommendations
   */
  async generateCampaignRecommendations(
    profiles: CustomerProfile[],
    availableCampaigns: any[],
    options: {
      max_campaigns?: number;
      min_confidence?: number;
      target_segments?: string[];
    } = {}
  ): Promise<CampaignRecommendation[]> {
    const {
      max_campaigns = 5,
      min_confidence = 0.4,
      target_segments
    } = options;

    const recommendations: CampaignRecommendation[] = [];

    // Analyze customer segments
    const segments = this.analyzeCustomerSegments(profiles);

    for (const campaign of availableCampaigns) {
      // Filter by target segments if specified
      if (
        target_segments &&
        !target_segments.includes(campaign.target_segment)
      ) {
        continue;
      }

      const targetCustomers = this.getSegmentCustomers(
        profiles,
        campaign.target_segment
      if (targetCustomers.length === 0) continue;

      const confidence = this.calculateCampaignConfidence(
        targetCustomers,
        campaign

      if (confidence < min_confidence) {
        continue;
      }

      const recommendation: CampaignRecommendation = {
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        campaign_type: campaign.type,
        target_segment: campaign.target_segment,
        message_template: this.personalizeMessage(
          campaign.template,
          targetCustomers[0]
        ),
        call_to_action: campaign.cta,
        confidence_score: confidence,
        expected_open_rate: this.estimateOpenRate(targetCustomers, campaign),
        expected_click_rate: this.estimateClickRate(targetCustomers, campaign),
        expected_conversion_rate: this.estimateCampaignConversionRate(
          targetCustomers,
          campaign
        ),
        optimal_send_time: this.calculateOptimalSendTime(
          targetCustomers,
          campaign
        ),
        urgency_level: this.determineUrgency(
          confidence,
          targetCustomers.length
        ),
        personalization_tokens: this.generatePersonalizationTokens(
          targetCustomers[0]
        ),
        a_b_test_variant: campaign.ab_test_enabled
          ? this.selectABTestVariant(targetCustomers[0])
          : undefined
      };

      recommendations.push(recommendation);
    }

    return recommendations
      .sort((a, b) => b.confidence_score - a.confidence_score)
      .slice(0, max_campaigns);
  }

  /**
   * Analyze customer segments for insights
   */
  analyzeCustomerSegments(profiles: CustomerProfile[]): SegmentInsight[] {
    // K-means clustering simulation for customer segmentation
    const segments = this.performCustomerSegmentation(profiles);

    return segments.map((segment) => ({
      segment_id: segment.id,
      segment_name: segment.name,
      customer_count: segment.customers.length,
      characteristics: this.identifySegmentCharacteristics(segment.customers),
      value_score: this.calculateSegmentValue(segment.customers),
      growth_potential: this.assessGrowthPotential(segment.customers),
      recommended_actions: this.generateSegmentActions(segment.customers),
      success_probability: this.estimateSegmentSuccessProbability(
        segment.customers
      ),
      expected_roi: this.calculateSegmentROI(segment.customers)
    }));
  }

  /**
   * Generate comprehensive recommendation summary
   */
  async generateRecommendationSummary(
    profiles: CustomerProfile[],
    productRecommendations: ProductRecommendation[],
    campaignRecommendations: CampaignRecommendation[]
  ): Promise<RecommendationSummary> {
    const segments = this.analyzeCustomerSegments(profiles);

    const segmentBreakdown: {
      [segment: string]: {
        count: number;
        expected_revenue: number;
        avg_confidence: number;
      };
    } = {};

    segments.forEach((segment) => {
      const segmentRecommendations = productRecommendations.filter(
        (r) =>
          this.getCustomerSegment(
            profiles.find((p) => p.customer_id === r.product_id)!
          ) === segment.segment_name

      segmentBreakdown[segment.segment_name] = {
        count: segmentRecommendations.length,
        expected_revenue: segmentRecommendations.reduce(
          (sum, r) => sum + r.expected_revenue,
          0
        ),
        avg_confidence:
          segmentRecommendations.length > 0
            ? segmentRecommendations.reduce(
                (sum, r) => sum + r.confidence_score,
                0
              ) / segmentRecommendations.length
            : 0
      };
    });

    return {
      total_recommendations:
        productRecommendations.length + campaignRecommendations.length,
      high_priority_count: productRecommendations.filter((r) =>
        ['high', 'urgent'].includes(r.priority)
      ).length,
      expected_total_revenue: productRecommendations.reduce(
        (sum, r) => sum + r.expected_revenue,
        0
      ),
      avg_confidence_score:
        productRecommendations.length > 0
          ? productRecommendations.reduce(
              (sum, r) => sum + r.confidence_score,
              0
            ) / productRecommendations.length
          : 0,
      top_opportunities: {
        product_recommendations: productRecommendations.length,
        campaign_recommendations: campaignRecommendations.length,
        cross_sell_opportunities: productRecommendations.filter(
          (r) => r.cross_sell_potential > 0.5
        ).length,
        up_sell_opportunities: productRecommendations.filter(
          (r) => r.up_sell_potential > 0.5
        ).length
      },
      segment_breakdown: segmentBreakdown
    };
  }

  // Private helper methods for ML calculations

  private calculateProductConfidence(
    profile: CustomerProfile,
    product: any
  ): number {
    let confidence = 0;

    // Behavioral similarity (past preferences)
    const behavioralScore = this.calculateBehavioralSimilarity(
      profile,
      product
    confidence += behavioralScore * this.featureWeights.behavioral_similarity;

    // Content similarity (product features)
    const contentScore = this.calculateContentSimilarity(profile, product);
    confidence += contentScore * this.featureWeights.content_similarity;

    // Temporal patterns (seasonal preferences)
    const temporalScore = this.calculateTemporalAlignment(profile, product);
    confidence += temporalScore * this.featureWeights.temporal_patterns;

    // Value alignment (price/budget match)
    const valueScore = this.calculateValueAlignment(profile, product);
    confidence += valueScore * this.featureWeights.value_alignment;

    // Engagement history
    const engagementScore = profile.engagement_score;
    confidence += engagementScore * this.featureWeights.engagement_history;

    // Conversion likelihood based on profile
    const conversionScore = this.calculateConversionLikelihood(profile);
    confidence += conversionScore * this.featureWeights.conversion_likelihood;

    // Loyalty factor
    const loyaltyScore = this.calculateLoyaltyScore(profile);
    confidence += loyaltyScore * this.featureWeights.loyalty_factor;

    return Math.max(0, Math.min(1, confidence));
  }

  private calculateBehavioralSimilarity(
    profile: CustomerProfile,
    product: any
  ): number {
    const preferredDestinations = profile.preferred_destinations;
    const bookingHistory = profile.booking_history;

    // Check destination preference alignment
    let destinationScore = preferredDestinations.includes(product.destination)
      ? 1.0
      : 0.3;

    // Check package type alignment
    const preferredPackageTypes = bookingHistory.map((b) => b.package_type);
    const packageTypeFreq = this.calculateFrequency(preferredPackageTypes);
    const packageScore = packageTypeFreq[product.package_type] || 0;

    // Check price range alignment
    const avgBookingValue = profile.avg_booking_value;
    const priceRatio =
      Math.min(product.price, avgBookingValue) /
      Math.max(product.price, avgBookingValue);
    const priceScore = priceRatio * 0.8 + 0.2; // Minimum 20% score

    return destinationScore * 0.5 + packageScore * 0.3 + priceScore * 0.2;
  }

  private calculateContentSimilarity(
    profile: CustomerProfile,
    product: any
  ): number {
    let similarity = 0;

    // Travel style alignment
    const travelStyleMatch = this.getTravelStyleMatch(
      profile.travel_style,
      product.travel_style
    similarity += travelStyleMatch * 0.4;

    // Budget range alignment
    const budgetMatch = this.getBudgetRangeMatch(
      profile.budget_range,
      product.price_category
    similarity += budgetMatch * 0.3;

    // Service features alignment (if available)
    if (product.features && profile.booking_history.length > 0) {
      const featurePreference = this.calculateFeaturePreference(
        profile.booking_history,
        product.features
      similarity += featurePreference * 0.3;
    } else {
      similarity += 0.15; // Neutral score if no feature data
    }

    return similarity;
  }

  private calculateTemporalAlignment(
    profile: CustomerProfile,
    product: any
  ): number {
    const currentMonth = new Date().getMonth();
    const currentSeason = this.getSeasonFromMonth(currentMonth);

    // Check if current season matches customer preferences
    const seasonalMatch = profile.seasonal_preferences.includes(currentSeason)
      ? 1.0
      : 0.3;

    // Check booking frequency patterns
    const optimalBookingWindow = this.calculateOptimalBookingWindow(profile);
    const timingScore = this.isWithinOptimalWindow(optimalBookingWindow)
      ? 1.0
      : 0.6;

    return seasonalMatch * 0.6 + timingScore * 0.4;
  }

  private calculateValueAlignment(
    profile: CustomerProfile,
    product: any
  ): number {
    const customerBudget = this.estimateCustomerBudget(profile);
    const productPrice = product.price;

    // Calculate price alignment score
    if (productPrice <= customerBudget * 0.8) {
      return 1.0; // Well within budget
    } else if (productPrice <= customerBudget * 1.2) {
      return 0.7; // Slightly above budget but acceptable
    } else if (productPrice <= customerBudget * 1.5) {
      return 0.3; // Stretch budget
    } else {
      return 0.1; // Beyond reasonable budget
    }
  }

  private calculateConversionLikelihood(profile: CustomerProfile): number {
    let likelihood = 0;

    // Booking recency (more recent = higher likelihood)
    const recencyScore = Math.max(0, 1 - profile.last_booking_days_ago / 365);
    likelihood += recencyScore * 0.3;

    // Booking frequency (more frequent = higher likelihood)
    const frequencyScore = Math.max(
      0,
      1 - profile.booking_frequency_days / 365
    likelihood += frequencyScore * 0.3;

    // Engagement score
    likelihood += profile.engagement_score * 0.2;

    // Loyalty tier bonus
    const loyaltyBonus = {
      bronze: 0.0,
      silver: 0.05,
      gold: 0.1,
      platinum: 0.2
    }[profile.loyalty_tier];
    likelihood += loyaltyBonus;

    return Math.min(1, likelihood);
  }

  private calculateLoyaltyScore(profile: CustomerProfile): number {
    const loyaltyValues = {
      bronze: 0.25,
      silver: 0.5,
      gold: 0.75,
      platinum: 1.0
    };
    return loyaltyValues[profile.loyalty_tier];
  }

  private wasRecentlyInteracted(
    profile: CustomerProfile,
    product: any
  ): boolean {
    const recentDays = 30;
    const recentDate = new Date(Date.now() - recentDays * 24 * 60 * 60 * 1000);

    return profile.booking_history.some(
      (booking) =>
        booking.destination === product.destination &&
        booking.booking_date >= recentDate
  }

  private generateProductReasoning(
    profile: CustomerProfile,
    product: any,
    confidence: number
  ): string[] {
    const reasons: string[] = [];

    if (profile.preferred_destinations.includes(product.destination)) {
      reasons.push(
    }

    if (confidence > 0.8) {
      reasons.push('High compatibility with your travel preferences');
    }

    const avgValue = profile.avg_booking_value;
    if (product.price <= avgValue * 1.1) {
      reasons.push('Within your typical spending range');
    }

    if (
      profile.loyalty_tier === 'gold' ||
      profile.loyalty_tier === 'platinum'
    ) {
      reasons.push('Exclusive offer for valued customers');
    }

    if (profile.engagement_score > 0.7) {
      reasons.push('Based on your high engagement with our recommendations');
    }

    return reasons.slice(0, 3); // Return top 3 reasons
  }

  private estimateConversionRate(
    profile: CustomerProfile,
    product: any,
    confidence: number
  ): number {
    // Base conversion rate based on confidence
    let conversionRate = confidence * 0.15; // Max 15% base rate

    // Adjust based on customer loyalty
    const loyaltyMultiplier = {
      bronze: 0.8,
      silver: 1.0,
      gold: 1.2,
      platinum: 1.5
    }[profile.loyalty_tier];
    conversionRate *= loyaltyMultiplier;

    // Adjust based on engagement
    const engagementMultiplier = 0.5 + profile.engagement_score * 1.0;
    conversionRate *= engagementMultiplier;

    // Adjust based on booking recency
    const recencyFactor = Math.max(
      0.5,
      1 - profile.last_booking_days_ago / 365
    conversionRate *= recencyFactor;

    return Math.max(0.01, Math.min(0.3, conversionRate)); // Between 1% and 30%
  }

  private determinePriority(
    confidence: number,
    price: number
  ): 'low' | 'medium' | 'high' | 'urgent' {
    if (confidence >= 0.8 && price >= 2000) return 'urgent';
    if (confidence >= 0.7) return 'high';
    if (confidence >= 0.5) return 'medium';
    return 'low';
  }

  private calculateValidityPeriod(
    profile: CustomerProfile,
    product: any
  ): number {
    // Higher engagement customers get longer validity
    const baseValidity = 30; // 30 days base
    const engagementBonus = Math.floor(profile.engagement_score * 30);
    const loyaltyBonus = { bronze: 0, silver: 7, gold: 14, platinum: 30 }[
      profile.loyalty_tier
    ];

    return baseValidity + engagementBonus + loyaltyBonus;
  }

  private identifyPersonalizationFactors(
    profile: CustomerProfile,
    product: any
  ): string[] {
    const factors: string[] = [];

    if (profile.preferred_destinations.includes(product.destination)) {
      factors.push('preferred_destination');
    }

    if (profile.travel_style) {
      factors.push(`travel_style_${profile.travel_style}`);
    }

    if (profile.loyalty_tier !== 'bronze') {
      factors.push(`loyalty_${profile.loyalty_tier}`);
    }

    if (profile.booking_history.length >= 3) {
      factors.push('repeat_customer');
    }

    return factors;
  }

  private calculateCrossSellPotential(
    profile: CustomerProfile,
    product: any
  ): number {
    // Analyze complementary products based on booking history
    const hasComplementaryBookings = profile.booking_history.some(
      (b) =>
        b.destination === product.destination &&
        b.package_type !== product.package_type

    let potential = hasComplementaryBookings ? 0.7 : 0.3;

    // Higher potential for loyal customers
    const loyaltyBonus = { bronze: 0, silver: 0.1, gold: 0.2, platinum: 0.3 }[
      profile.loyalty_tier
    ];
    potential += loyaltyBonus;

    return Math.min(1, potential);
  }

  private calculateUpSellPotential(
    profile: CustomerProfile,
    product: any
  ): number {
    // Check if customer has booked lower-tier packages for same destination
    const hasLowerTierBookings = profile.booking_history.some(
      (b) =>
        b.destination === product.destination &&
        this.getPackageTierValue(b.package_type) <
          this.getPackageTierValue(product.package_type)

    let potential = hasLowerTierBookings ? 0.8 : 0.2;

    // Consider spending capacity
    if (profile.avg_booking_value * 1.5 >= product.price) {
      potential += 0.2;
    }

    return Math.min(1, potential);
  }

  private getPackageTierValue(packageType: string): number {
    const tierValues = { economy: 1, standard: 2, premium: 3, luxury: 4 };
    return tierValues[packageType as keyof typeof tierValues] || 1;
  }

  // Campaign-related methods
  private calculateCampaignConfidence(
    customers: CustomerProfile[],
    campaign: any
  ): number {
    if (customers.length === 0) return 0;

    const avgEngagement =
      customers.reduce((sum, c) => sum + c.engagement_score, 0) /
      customers.length;
    const segmentFit = this.calculateSegmentFit(
      customers,
      campaign.target_segment
    const timingScore = this.calculateTimingScore(campaign);

    return avgEngagement * 0.4 + segmentFit * 0.4 + timingScore * 0.2;
  }

  private estimateOpenRate(
    customers: CustomerProfile[],
    campaign: any
  ): number {
    const avgEngagement =
      customers.reduce((sum, c) => sum + c.engagement_score, 0) /
      customers.length;
    const baseOpenRate = { email: 0.22, sms: 0.85, push: 0.15, whatsapp: 0.7 }[
      campaign.type
    ];

    return Math.min(0.95, baseOpenRate + avgEngagement * 0.3);
  }

  private estimateClickRate(
    customers: CustomerProfile[],
    campaign: any
  ): number {
    const openRate = this.estimateOpenRate(customers, campaign);
    const baseClickThroughRate = {
      email: 0.03,
      sms: 0.15,
      push: 0.02,
      whatsapp: 0.2
    }[campaign.type];

    return Math.min(0.5, baseClickThroughRate * (openRate / 0.5));
  }

  private estimateCampaignConversionRate(
    customers: CustomerProfile[],
    campaign: any
  ): number {
    const clickRate = this.estimateClickRate(customers, campaign);
    const avgConversionLikelihood =
      customers.reduce(
        (sum, c) => sum + this.calculateConversionLikelihood(c),
        0
      ) / customers.length;

    return clickRate * avgConversionLikelihood * 0.1; // 10% of clickers typically convert
  }

  // Segmentation methods
  private performCustomerSegmentation(
    profiles: CustomerProfile[]
  ): Array<{ id: string; name: string; customers: CustomerProfile[] }> {
    // Simplified K-means clustering simulation
    const segments = [
      {
        id: 'high_value_frequent',
        name: 'High-Value Frequent Travelers',
        customers: [] as CustomerProfile[]
      },
      {
        id: 'budget_conscious',
        name: 'Budget-Conscious Travelers',
        customers: [] as CustomerProfile[]
      },
      {
        id: 'luxury_seekers',
        name: 'Luxury Experience Seekers',
        customers: [] as CustomerProfile[]
      },
      {
        id: 'family_travelers',
        name: 'Family Travelers',
        customers: [] as CustomerProfile[]
      },
      {
        id: 'inactive_high_potential',
        name: 'Inactive High-Potential',
        customers: [] as CustomerProfile[]
      }
    ];

    profiles.forEach((profile) => {
      const segment = this.assignCustomerToSegment(profile);
      const targetSegment = segments.find((s) => s.id === segment);
      if (targetSegment) {
        targetSegment.customers.push(profile);
      }
    });

    return segments.filter((s) => s.customers.length > 0);
  }

  private assignCustomerToSegment(profile: CustomerProfile): string {
    // High-value frequent travelers
    if (
      profile.total_spent > 10000 &&
      profile.booking_frequency_days < 90 &&
      profile.last_booking_days_ago < 60
    ) {
      return 'high_value_frequent';
    }

    // Luxury seekers
    if (profile.budget_range === 'luxury' && profile.avg_booking_value > 3000) {
      return 'luxury_seekers';
    }

    // Budget conscious
    if (profile.budget_range === 'budget' && profile.avg_booking_value < 1000) {
      return 'budget_conscious';
    }

    // Family travelers
    if (profile.travel_style === 'family') {
      return 'family_travelers';
    }

    // Inactive high potential
    if (profile.total_spent > 5000 && profile.last_booking_days_ago > 180) {
      return 'inactive_high_potential';
    }

    // Default to budget conscious
    return 'budget_conscious';
  }

  // Helper methods
  private calculateFrequency<T>(array: T[]): Record<string, number> {
    const freq: Record<string, number> = {};
    const total = array.length;

    array.forEach((item) => {
      const key = String(item);
      freq[key] = (freq[key] || 0) + 1;
    });

    // Convert to percentages
    Object.keys(freq).forEach((key) => {
      freq[key] = freq[key] / total;
    });

    return freq;
  }

  private getSeasonFromMonth(
    month: number
  ): 'spring' | 'summer' | 'autumn' | 'winter' {
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }

  private getTravelStyleMatch(
    profileStyle: string,
    productStyle: string
  ): number {
    return profileStyle === productStyle ? 1.0 : 0.5;
  }

  private getBudgetRangeMatch(
    profileBudget: string,
    productCategory: string
  ): number {
    const budgetMap: Record<string, number> = {
      budget: 1,
      'mid-range': 2,
      premium: 3,
      luxury: 4
    };
    const profileValue = budgetMap[profileBudget] || 2;
    const productValue = budgetMap[productCategory] || 2;

    return Math.max(0, 1 - Math.abs(profileValue - productValue) * 0.3);
  }

  private calculateFeaturePreference(
    bookingHistory: any[],
    productFeatures: string[]
  ): number {
    // Simplified feature preference calculation
    return 0.5; // Neutral score without detailed feature data
  }

  private calculateOptimalBookingWindow(profile: CustomerProfile): {
    start: number;
    end: number;
  } {
    // Based on booking frequency, calculate optimal window
    const frequency = profile.booking_frequency_days;
    const lastBooking = profile.last_booking_days_ago;

    return {
      start: Math.max(0, frequency - 30),
      end: frequency + 30
    };
  }

  private isWithinOptimalWindow(window: {
    start: number;
    end: number;
  }): boolean {
    const currentDay = 0; // Assume current day for simplicity
    return currentDay >= window.start && currentDay <= window.end;
  }

  private estimateCustomerBudget(profile: CustomerProfile): number {
    // Estimate based on average booking value with some growth allowance
    return profile.avg_booking_value * 1.2;
  }

  private getSegmentCustomers(
    profiles: CustomerProfile[],
    segment: string
  ): CustomerProfile[] {
    return profiles.filter((p) => this.assignCustomerToSegment(p) === segment);
  }

  private personalizeMessage(
    template: string,
    customer: CustomerProfile
  ): string {
    return template
      .replace('{{name}}', customer.customer_id.split('-')[0])
      .replace('{{loyalty_tier}}', customer.loyalty_tier);
  }

  private calculateOptimalSendTime(
    customers: CustomerProfile[],
    campaign: any
  ): { day_of_week: number; hour: number; timezone: string } {
    // Simplified optimal timing calculation
    return {
      day_of_week: 2, // Tuesday
      hour: 10, // 10 AM
      timezone: 'Europe/Berlin'
    };
  }

  private determineUrgency(
    confidence: number,
    customerCount: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (confidence >= 0.8 && customerCount >= 100) return 'critical';
    if (confidence >= 0.7) return 'high';
    if (confidence >= 0.5) return 'medium';
    return 'low';
  }

  private generatePersonalizationTokens(
    customer: CustomerProfile
  ): Record<string, string> {
    return {
      customer_id: customer.customer_id,
      loyalty_tier: customer.loyalty_tier,
      preferred_destination: customer.preferred_destinations[0] || 'Mecca',
      last_booking_value: customer.avg_booking_value.toString()
    };
  }

  private selectABTestVariant(customer: CustomerProfile): string {
    return customer.customer_id.endsWith('1') ? 'variant_a' : 'variant_b';
  }

  private identifySegmentCharacteristics(
    customers: CustomerProfile[]
  ): string[] {
    const characteristics: string[] = [];

    const avgAge =
      customers.reduce((sum, c) => sum + c.age, 0) / customers.length;
    characteristics.push(`Average age: ${Math.round(avgAge)}`);

    const avgSpending =
      customers.reduce((sum, c) => sum + c.total_spent, 0) / customers.length;
    characteristics.push(`Average spending: €${Math.round(avgSpending)}`);

    const dominantTravelStyle = this.getDominantValue(
      customers.map((c) => c.travel_style)
    characteristics.push(`Primary travel style: ${dominantTravelStyle}`);

    return characteristics;
  }

  private calculateSegmentValue(customers: CustomerProfile[]): number {
    const totalValue = customers.reduce((sum, c) => sum + c.total_spent, 0);
    const customerCount = customers.length;
    return totalValue / customerCount; // Average customer value
  }

  private assessGrowthPotential(customers: CustomerProfile[]): number {
    const avgEngagement =
      customers.reduce((sum, c) => sum + c.engagement_score, 0) /
      customers.length;
    const recentBookingRate =
      customers.filter((c) => c.last_booking_days_ago < 90).length /
      customers.length;

    return avgEngagement * 0.6 + recentBookingRate * 0.4;
  }

  private generateSegmentActions(customers: CustomerProfile[]): string[] {
    const actions: string[] = [];

    const avgEngagement =
      customers.reduce((sum, c) => sum + c.engagement_score, 0) /
      customers.length;
    if (avgEngagement < 0.5) {
      actions.push('Implement re-engagement campaigns');
    }

    const inactiveCount = customers.filter(
      (c) => c.last_booking_days_ago > 180
    ).length;
    if (inactiveCount > customers.length * 0.3) {
      actions.push('Launch win-back campaigns for inactive customers');
    }

    actions.push('Personalize product recommendations');
    actions.push('Optimize communication timing');

    return actions;
  }

  private estimateSegmentSuccessProbability(
    customers: CustomerProfile[]
  ): number {
    const avgConversionLikelihood =
      customers.reduce(
        (sum, c) => sum + this.calculateConversionLikelihood(c),
        0
      ) / customers.length;
    return avgConversionLikelihood;
  }

  private calculateSegmentROI(customers: CustomerProfile[]): number {
    const avgCustomerValue = this.calculateSegmentValue(customers);
    const successProbability =
      this.estimateSegmentSuccessProbability(customers);
    const estimatedCampaignCost = 50; // €50 per customer campaign cost

    return (
      (avgCustomerValue * 0.1 * successProbability - estimatedCampaignCost) /
      estimatedCampaignCost
  }

  private getCustomerSegment(profile: CustomerProfile): string {
    return this.assignCustomerToSegment(profile);
  }

  private calculateSegmentFit(
    customers: CustomerProfile[],
    targetSegment: string
  ): number {
    const matchingCustomers = customers.filter(
      (c) => this.assignCustomerToSegment(c) === targetSegment
    return matchingCustomers.length / customers.length;
  }

  private calculateTimingScore(campaign: any): number {
    // Simplified timing score based on campaign type
    const currentHour = new Date().getHours();

    if (campaign.type === 'email') {
      return (currentHour >= 9 && currentHour <= 11) ||
        (currentHour >= 14 && currentHour <= 16)
        ? 1.0
        : 0.6;
    }

    return 0.8; // Default score
  }

  private getDominantValue<T>(values: T[]): T {
    const frequency = this.calculateFrequency(values);
    let maxFreq = 0;
    let dominant = values[0];

    Object.entries(frequency).forEach(([value, freq]) => {
      if (freq > maxFreq) {
        maxFreq = freq;
        dominant = values.find((v) => String(v) === value) || values[0];
      }
    });

    return dominant;
  }
}
