import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasRedisConfig =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
  Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

const redis = hasRedisConfig ? Redis.fromEnv() : null;

export const geminiRL = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(15, "60 s"),
      analytics: true,
      prefix: "rl:gemini",
    })
  : null;

export const feedbackRL = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "60 s"),
      analytics: true,
      prefix: "rl:feedback",
    })
  : null;

export const explainRL = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "60 s"),
      analytics: true,
      prefix: "rl:explain",
    })
  : null;

export function getIp(request: Request): string | null {
  const forwardedFor = request.headers.get("x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() ?? null;
  }

  return request.headers.get("x-real-ip");
}

export function rlKey(scope: string, sid: string | null, request: Request): string {
  return `${scope}:${sid ?? getIp(request) ?? "anon"}`;
}

export async function limitOrAllow(
  limiter: Ratelimit | null,
  key: string,
): Promise<{ success: boolean; reset: number }> {
  if (!limiter) {
    return { success: true, reset: Date.now() };
  }

  try {
    const result = await limiter.limit(key);
    return {
      success: result.success,
      reset: result.reset,
    };
  } catch (error) {
    console.error("Rate limit probe failed, allowing request.", error);
    return { success: true, reset: Date.now() };
  }
}

export function getRedisClient(): Redis | null {
  return redis;
}

export async function getRedisValue<T>(key: string): Promise<T | null> {
  if (!redis) {
    return null;
  }

  try {
    return (await redis.get<T>(key)) ?? null;
  } catch (error) {
    console.error("Redis get failed, ignoring cache lookup.", error);
    return null;
  }
}

export async function setRedisValue(
  key: string,
  value: string,
  exSeconds: number,
): Promise<void> {
  if (!redis) {
    return;
  }

  try {
    await redis.set(key, value, { ex: exSeconds });
  } catch (error) {
    console.error("Redis set failed, ignoring cache write.", error);
  }
}
