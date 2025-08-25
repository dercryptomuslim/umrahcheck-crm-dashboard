/**
 * Rate Limiting Utility
 * In-memory rate limiter for API endpoints
 * Production should use Redis-based solution
 */

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

class InMemoryRateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 3600000, maxRequests: number = 30) {
    // 1 hour, 30 requests
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Clean up expired entries every 5 minutes
    setInterval(() => this.cleanup(), 300000);
  }

  async limit(identifier: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    const userRequests = this.requests.get(identifier);

    if (!userRequests || userRequests.resetTime <= now) {
      // First request or window expired
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });

      return {
        success: true,
        limit: this.maxRequests,
        remaining: this.maxRequests - 1,
        reset: now + this.windowMs
      };
    }

    if (userRequests.count >= this.maxRequests) {
      return {
        success: false,
        limit: this.maxRequests,
        remaining: 0,
        reset: userRequests.resetTime
      };
    }

    // Increment count
    userRequests.count++;

    return {
      success: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - userRequests.count,
      reset: userRequests.resetTime
    };
  }

  private cleanup(): void {
    const now = Date.now();

    for (const [identifier, data] of this.requests.entries()) {
      if (data.resetTime <= now) {
        this.requests.delete(identifier);
      }
    }
  }
}

// Create rate limiter instances
export const ratelimit = new InMemoryRateLimiter(3600000, 30); // 30 requests per hour
export const churnRatelimit = new InMemoryRateLimiter(3600000, 20); // 20 requests per hour
