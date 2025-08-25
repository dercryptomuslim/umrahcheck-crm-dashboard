/**
 * ML Churn Prediction Model
 * Phase 3.3: Predictive Analytics
 *
 * Customer churn risk prediction using behavioral analysis and machine learning
 * for UmrahCheck CRM retention insights
 */

export interface CustomerBehavior {
  customer_id: string;
  total_bookings: number;
  total_spent: number;
  avg_booking_value: number;
  last_booking_days_ago: number;
  booking_frequency_days: number; // Average days between bookings
  email_open_rate: number;
  email_click_rate: number;
  website_visits_last_30d: number;
  support_tickets_count: number;
  refund_requests: number;
  preferred_destination_changes: number;
  payment_delays: number;
  mobile_app_usage: number;
  newsletter_subscribed: boolean;
  referral_count: number;
  account_age_days: number;
  last_login_days_ago: number;
  profile_completion: number; // 0-1 score
}

export interface ChurnRiskScore {
  customer_id: string;
  churn_probability: number; // 0-1
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  primary_risk_factors: string[];
  recommended_actions: string[];
  retention_score: number; // Inverse of churn probability
  predicted_ltv_remaining: number;
  time_to_churn_days: number | null;
}

export interface ChurnModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  auc_roc: number;
  feature_importance: { [feature: string]: number };
  model_confidence: number;
  training_data_size: number;
  last_trained: Date;
}

export interface ChurnInsights {
  total_customers: number;
  high_risk_count: number;
  churn_rate_trend: number; // % change
  top_risk_factors: Array<{
    factor: string;
    impact: number;
    frequency: number;
  }>;
  retention_opportunities: Array<{
    segment: string;
    customer_count: number;
    potential_revenue: number;
    recommended_action: string;
  }>;
}

export class ChurnPredictor {
  // Feature weights optimized for travel/booking industry
  private readonly featureWeights = {
    recency: 0.25, // How recently they booked
    frequency: 0.2, // How often they book
    monetary: 0.2, // How much they spend
    engagement: 0.15, // Email/website engagement
    satisfaction: 0.1, // Support tickets, refunds
    loyalty: 0.1 // Referrals, account age
  };

  /**
   * Predict churn risk for a single customer
   */
  predictChurnRisk(behavior: CustomerBehavior): ChurnRiskScore {
    const features = this.extractFeatures(behavior);
    const churnProbability = this.calculateChurnProbability(features);
    const confidence = this.calculateConfidence(features);
    const riskLevel = this.categorizeRisk(churnProbability);
    const riskFactors = this.identifyRiskFactors(features, behavior);
    const recommendedActions = this.generateRecommendations(
      riskLevel,
      riskFactors,
      behavior
    );
    const retentionScore = 1 - churnProbability;
    const predictedLTV = this.estimateRemainingLTV(behavior, retentionScore);
    const timeToChurn = this.estimateTimeToChurn(features, churnProbability);

    return {
      customer_id: behavior.customer_id,
      churn_probability: Math.round(churnProbability * 1000) / 1000,
      risk_level: riskLevel,
      confidence: Math.round(confidence * 1000) / 1000,
      primary_risk_factors: riskFactors,
      recommended_actions: recommendedActions,
      retention_score: Math.round(retentionScore * 1000) / 1000,
      predicted_ltv_remaining: Math.round(predictedLTV * 100) / 100,
      time_to_churn_days: timeToChurn
    };
  }

  /**
   * Batch predict churn risk for multiple customers
   */
  async batchPredictChurn(
    behaviors: CustomerBehavior[],
    options: {
      prioritize_high_value?: boolean;
      min_confidence?: number;
      max_results?: number;
    } = {}
  ): Promise<ChurnRiskScore[]> {
    const predictions = behaviors.map((behavior) =>
      this.predictChurnRisk(behavior)
    );

    let filtered = predictions;

    // Apply confidence filter
    if (options.min_confidence) {
      filtered = filtered.filter((p) => p.confidence >= options.min_confidence);
    }

    // Sort by risk level and potential value
    filtered.sort((a, b) => {
      if (options.prioritize_high_value) {
        // Prioritize high-value customers at risk
        const aValue = a.predicted_ltv_remaining * a.churn_probability;
        const bValue = b.predicted_ltv_remaining * b.churn_probability;
        return bValue - aValue;
      }

      // Default: sort by churn probability (highest risk first)
      return b.churn_probability - a.churn_probability;
    });

    // Limit results
    if (options.max_results) {
      filtered = filtered.slice(0, options.max_results);
    }

    return filtered;
  }

  /**
   * Extract normalized features from customer behavior
   */
  private extractFeatures(behavior: CustomerBehavior): {
    [key: string]: number;
  } {
    const features: { [key: string]: number } = {};

    // Recency features (0-1, where 1 = recent activity)
    features.booking_recency = this.normalizeRecency(
      behavior.last_booking_days_ago
    );
    features.login_recency = this.normalizeRecency(
      behavior.last_login_days_ago
    );

    // Frequency features (0-1, where 1 = high frequency)
    features.booking_frequency = this.normalizeFrequency(
      behavior.booking_frequency_days
    );
    features.website_activity = this.normalizeWebsiteActivity(
      behavior.website_visits_last_30d
    );

    // Monetary features (0-1, where 1 = high value)
    features.total_value = this.normalizeMonetary(behavior.total_spent);
    features.avg_order_value = this.normalizeAOV(behavior.avg_booking_value);

    // Engagement features (0-1, where 1 = high engagement)
    features.email_engagement =
      (behavior.email_open_rate + behavior.email_click_rate) / 2;
    features.mobile_usage = this.normalizeMobileUsage(
      behavior.mobile_app_usage
    );

    // Satisfaction features (0-1, where 1 = satisfied)
    features.support_satisfaction = this.normalizeSupportActivity(
      behavior.support_tickets_count
    );
    features.payment_reliability = this.normalizePaymentBehavior(
      behavior.payment_delays
    );
    features.refund_risk = this.normalizeRefundHistory(
      behavior.refund_requests
    );

    // Loyalty features (0-1, where 1 = loyal)
    features.account_tenure = this.normalizeAccountAge(
      behavior.account_age_days
    );
    features.referral_activity = this.normalizeReferrals(
      behavior.referral_count
    );
    features.newsletter_loyalty = behavior.newsletter_subscribed ? 1 : 0;
    features.profile_completeness = behavior.profile_completion;

    return features;
  }

  /**
   * Calculate churn probability using weighted feature scoring
   */
  private calculateChurnProbability(features: {
    [key: string]: number;
  }): number {
    // RFM Analysis
    const recencyScore =
      (features.booking_recency + features.login_recency) / 2;
    const frequencyScore =
      (features.booking_frequency + features.website_activity) / 2;
    const monetaryScore = (features.total_value + features.avg_order_value) / 2;

    // Engagement Score
    const engagementScore =
      (features.email_engagement +
        features.mobile_usage +
        features.newsletter_loyalty) /
      3;

    // Satisfaction Score
    const satisfactionScore =
      (features.support_satisfaction +
        features.payment_reliability +
        (1 - features.refund_risk)) / // Invert refund risk
      3;

    // Loyalty Score
    const loyaltyScore =
      (features.account_tenure +
        features.referral_activity +
        features.profile_completeness) /
      3;

    // Calculate weighted churn score (higher score = lower churn risk)
    const healthScore =
      recencyScore * this.featureWeights.recency +
      frequencyScore * this.featureWeights.frequency +
      monetaryScore * this.featureWeights.monetary +
      engagementScore * this.featureWeights.engagement +
      satisfactionScore * this.featureWeights.satisfaction +
      loyaltyScore * this.featureWeights.loyalty;

    // Convert to churn probability (invert health score)
    const churnProbability = Math.max(0, Math.min(1, 1 - healthScore));

    // Apply sigmoid function for more realistic probability distribution
    return 1 / (1 + Math.exp(-5 * (churnProbability - 0.5)));
  }

  /**
   * Calculate prediction confidence based on feature completeness and consistency
   */
  private calculateConfidence(features: { [key: string]: number }): number {
    const featureValues = Object.values(features);
    const completeness =
      featureValues.filter((v) => v !== null && v !== undefined).length /
      featureValues.length;

    // Calculate feature consistency (lower variance = higher confidence)
    const mean =
      featureValues.reduce((a, b) => a + b, 0) / featureValues.length;
    const variance =
      featureValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      featureValues.length;
    const consistency = Math.max(0, 1 - variance);

    // Combine completeness and consistency
    return Math.sqrt(completeness * consistency);
  }

  /**
   * Categorize churn probability into risk levels
   */
  private categorizeRisk(
    probability: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (probability < 0.25) return 'low';
    if (probability < 0.5) return 'medium';
    if (probability < 0.75) return 'high';
    return 'critical';
  }

  /**
   * Identify primary risk factors contributing to churn risk
   */
  private identifyRiskFactors(
    features: { [key: string]: number },
    behavior: CustomerBehavior
  ): string[] {
    const riskFactors: string[] = [];

    // Check each feature category for risk signals
    if (features.booking_recency < 0.3) {
      riskFactors.push(
        `Long time since last booking (${behavior.last_booking_days_ago} days)`
      );
    }

    if (features.booking_frequency < 0.3) {
      riskFactors.push('Low booking frequency');
    }

    if (features.email_engagement < 0.3) {
      riskFactors.push('Poor email engagement');
    }

    if (features.login_recency < 0.3) {
      riskFactors.push('Infrequent login activity');
    }

    if (behavior.support_tickets_count > 3) {
      riskFactors.push('High support ticket volume');
    }

    if (behavior.refund_requests > 0) {
      riskFactors.push('History of refund requests');
    }

    if (behavior.payment_delays > 1) {
      riskFactors.push('Payment reliability issues');
    }

    if (features.website_activity < 0.2) {
      riskFactors.push('Low website engagement');
    }

    if (!behavior.newsletter_subscribed) {
      riskFactors.push('Not subscribed to newsletter');
    }

    if (features.profile_completeness < 0.5) {
      riskFactors.push('Incomplete profile');
    }

    // Return top risk factors (max 5)
    return riskFactors.slice(0, 5);
  }

  /**
   * Generate actionable retention recommendations
   */
  private generateRecommendations(
    riskLevel: string,
    riskFactors: string[],
    behavior: CustomerBehavior
  ): string[] {
    const recommendations: string[] = [];

    switch (riskLevel) {
      case 'critical':
        recommendations.push('Schedule immediate personal outreach call');
        recommendations.push('Offer exclusive discount or upgrade');
        if (behavior.total_spent > 2000) {
          recommendations.push('Assign dedicated account manager');
        }
        break;

      case 'high':
        recommendations.push('Send personalized retention email campaign');
        recommendations.push('Offer loyalty bonus or reward points');
        break;

      case 'medium':
        recommendations.push(
          'Include in monthly newsletter with special offers'
        );
        recommendations.push(
          'Send destination recommendation based on preferences'
        );
        break;

      case 'low':
        recommendations.push('Continue regular engagement campaigns');
        break;
    }

    // Risk-factor specific recommendations
    riskFactors.forEach((factor) => {
      if (factor.includes('email engagement')) {
        recommendations.push('Optimize email content and timing');
      }
      if (factor.includes('login activity')) {
        recommendations.push('Send app usage reminder with benefits');
      }
      if (factor.includes('support tickets')) {
        recommendations.push('Proactive customer service follow-up');
      }
      if (factor.includes('booking frequency')) {
        recommendations.push('Send seasonal travel inspiration');
      }
      if (factor.includes('newsletter')) {
        recommendations.push('Newsletter re-subscription campaign');
      }
    });

    // Remove duplicates and return top 4 recommendations
    return [...new Set(recommendations)].slice(0, 4);
  }

  /**
   * Estimate remaining customer lifetime value
   */
  private estimateRemainingLTV(
    behavior: CustomerBehavior,
    retentionScore: number
  ): number {
    const avgBookingValue = behavior.avg_booking_value || 1500; // Default for Umrah/Hajj
    const historicalBookingFrequency = behavior.booking_frequency_days || 365;
    const expectedYearsRemaining = retentionScore * 3; // Assume max 3 year horizon

    const bookingsPerYear = 365 / historicalBookingFrequency;
    const predictedLTV =
      avgBookingValue *
      bookingsPerYear *
      expectedYearsRemaining *
      retentionScore;

    return Math.max(0, predictedLTV);
  }

  /**
   * Estimate time until customer churns (in days)
   */
  private estimateTimeToChurn(
    features: { [key: string]: number },
    churnProbability: number
  ): number | null {
    if (churnProbability < 0.3) return null; // Low risk customers

    // Base time estimation on engagement trends and recency
    const engagementDecline =
      1 - (features.email_engagement + features.website_activity) / 2;
    const recencyFactor =
      1 - (features.booking_recency + features.login_recency) / 2;

    // Accelerated timeline for high-risk customers
    const baseTimeToChurn = 90; // 90 days base
    const adjustedTime =
      baseTimeToChurn * (1 - churnProbability) * (1 - engagementDecline);

    return Math.max(7, Math.round(adjustedTime)); // Minimum 7 days
  }

  // Normalization helper functions
  private normalizeRecency(daysAgo: number): number {
    // 0 days = 1.0, 90+ days = 0.0
    return Math.max(0, 1 - daysAgo / 90);
  }

  private normalizeFrequency(avgDaysBetween: number): number {
    // 30 days = 1.0, 365+ days = 0.0
    return Math.max(0, 1 - (avgDaysBetween - 30) / 335);
  }

  private normalizeMonetary(totalSpent: number): number {
    // Normalize based on typical Umrah/Hajj spending (€1000-€10000)
    return Math.min(1, Math.max(0, (totalSpent - 1000) / 9000));
  }

  private normalizeAOV(avgOrderValue: number): number {
    // Normalize based on typical booking value (€500-€5000)
    return Math.min(1, Math.max(0, (avgOrderValue - 500) / 4500));
  }

  private normalizeWebsiteActivity(visits: number): number {
    // 0 visits = 0.0, 20+ visits = 1.0
    return Math.min(1, visits / 20);
  }

  private normalizeMobileUsage(usage: number): number {
    // Already expected to be 0-1 score
    return Math.min(1, Math.max(0, usage));
  }

  private normalizeSupportActivity(ticketCount: number): number {
    // 0 tickets = 1.0, 5+ tickets = 0.0 (more tickets = less satisfaction)
    return Math.max(0, 1 - ticketCount / 5);
  }

  private normalizePaymentBehavior(delays: number): number {
    // 0 delays = 1.0, 3+ delays = 0.0
    return Math.max(0, 1 - delays / 3);
  }

  private normalizeRefundHistory(refunds: number): number {
    // 0 refunds = 0.0, 3+ refunds = 1.0 (more refunds = higher risk)
    return Math.min(1, refunds / 3);
  }

  private normalizeAccountAge(ageDays: number): number {
    // 0 days = 0.0, 730+ days (2 years) = 1.0
    return Math.min(1, ageDays / 730);
  }

  private normalizeReferrals(referralCount: number): number {
    // 0 referrals = 0.0, 5+ referrals = 1.0
    return Math.min(1, referralCount / 5);
  }

  /**
   * Generate churn insights for dashboard
   */
  async generateChurnInsights(
    customerBehaviors: CustomerBehavior[]
  ): Promise<ChurnInsights> {
    const predictions = await this.batchPredictChurn(customerBehaviors);

    const totalCustomers = predictions.length;
    const highRiskCount = predictions.filter(
      (p) => p.risk_level === 'high' || p.risk_level === 'critical'
    ).length;

    // Calculate churn rate trend (this would ideally compare to historical data)
    const avgChurnProbability =
      predictions.reduce((sum, p) => sum + p.churn_probability, 0) /
      totalCustomers;
    const churnRateTrend = Math.round((avgChurnProbability - 0.25) * 100); // Compare to 25% baseline

    // Analyze top risk factors
    const riskFactorCounts: { [factor: string]: number } = {};
    predictions.forEach((p) => {
      p.primary_risk_factors.forEach((factor) => {
        riskFactorCounts[factor] = (riskFactorCounts[factor] || 0) + 1;
      });
    });

    const topRiskFactors = Object.entries(riskFactorCounts)
      .map(([factor, frequency]) => ({
        factor,
        impact: frequency / totalCustomers,
        frequency
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    // Identify retention opportunities
    const retentionOpportunities =
      this.identifyRetentionOpportunities(predictions);

    return {
      total_customers: totalCustomers,
      high_risk_count: highRiskCount,
      churn_rate_trend: churnRateTrend,
      top_risk_factors: topRiskFactors,
      retention_opportunities: retentionOpportunities
    };
  }

  /**
   * Identify retention opportunities by customer segments
   */
  private identifyRetentionOpportunities(predictions: ChurnRiskScore[]): Array<{
    segment: string;
    customer_count: number;
    potential_revenue: number;
    recommended_action: string;
  }> {
    const opportunities = [];

    // High-value at-risk customers
    const highValueAtRisk = predictions.filter(
      (p) =>
        (p.risk_level === 'high' || p.risk_level === 'critical') &&
        p.predicted_ltv_remaining > 2000
    );

    if (highValueAtRisk.length > 0) {
      opportunities.push({
        segment: 'High-Value At-Risk',
        customer_count: highValueAtRisk.length,
        potential_revenue: highValueAtRisk.reduce(
          (sum, p) => sum + p.predicted_ltv_remaining,
          0
        ),
        recommended_action: 'Personal outreach with VIP treatment'
      });
    }

    // Medium risk with engagement issues
    const mediumRiskEngagement = predictions.filter(
      (p) =>
        p.risk_level === 'medium' &&
        p.primary_risk_factors.some(
          (f) => f.includes('engagement') || f.includes('email')
        )
    );

    if (mediumRiskEngagement.length > 0) {
      opportunities.push({
        segment: 'Engagement Issues',
        customer_count: mediumRiskEngagement.length,
        potential_revenue: mediumRiskEngagement.reduce(
          (sum, p) => sum + p.predicted_ltv_remaining,
          0
        ),
        recommended_action: 'Personalized content marketing campaign'
      });
    }

    // Win-back dormant customers
    const dormantCustomers = predictions.filter(
      (p) =>
        p.risk_level === 'high' &&
        p.primary_risk_factors.some(
          (f) => f.includes('booking') || f.includes('login')
        )
    );

    if (dormantCustomers.length > 0) {
      opportunities.push({
        segment: 'Dormant Customers',
        customer_count: dormantCustomers.length,
        potential_revenue: dormantCustomers.reduce(
          (sum, p) => sum + p.predicted_ltv_remaining,
          0
        ),
        recommended_action: 'Win-back campaign with special offers'
      });
    }

    return opportunities.slice(0, 3); // Top 3 opportunities
  }
}

// Export singleton instance
export const churnPredictor = new ChurnPredictor();
