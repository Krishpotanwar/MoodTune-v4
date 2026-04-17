import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasRedisConfig =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
  Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

const redis = hasRedisConfig ? Redis.fromEnv() : null;

export const rateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 m"),
      analytics: false,
      prefix: "moodtune-v4",
    })
  : null;

export function buildRateLimitKey(scope: string, sid?: string, ip?: string): string {
  return `${scope}:${sid ?? ip ?? "anonymous"}`;
}
