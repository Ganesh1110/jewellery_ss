export interface RateLimitOptions {
  limit: number; // Max requests within the window
  windowSeconds: number; // Duration of the window in seconds
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

// In-memory sliding window fallback with TTL cleanup
const memoryStore = new Map<string, { count: number; expiresAt: number }>();

// Periodic garbage collection every 60 seconds
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    memoryStore.forEach((value, key) => {
      if (value.expiresAt <= now) {
        memoryStore.delete(key);
      }
    });
  }, 60000).unref?.();
}

export async function rateLimit(
  identifier: string,
  options: RateLimitOptions = { limit: 60, windowSeconds: 60 }
): Promise<RateLimitResult> {
  const { limit, windowSeconds } = options;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  // Optional: If Upstash Redis credentials are present in env
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    try {
      const key = `ratelimit:${identifier}`;
      // Execute atomic INCR and EXPIRE in Upstash REST pipeline
      const pipelineRes = await fetch(`${upstashUrl}/pipeline`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${upstashToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([
          ['INCR', key],
          ['EXPIRE', key, windowSeconds],
        ]),
      });

      if (pipelineRes.ok) {
        const data = await pipelineRes.json();
        const currentCount = Number(data[0]?.result) || 1;
        const remaining = Math.max(0, limit - currentCount);
        return {
          success: currentCount <= limit,
          limit,
          remaining,
          resetAt: now + windowMs,
        };
      }
    } catch {
      // Fall through to memory store if network error
    }
  }

  // Fallback: In-memory store
  const record = memoryStore.get(identifier);

  if (!record || record.expiresAt <= now) {
    memoryStore.set(identifier, {
      count: 1,
      expiresAt: now + windowMs,
    });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      resetAt: now + windowMs,
    };
  }

  record.count += 1;
  const remaining = Math.max(0, limit - record.count);
  const success = record.count <= limit;

  return {
    success,
    limit,
    remaining,
    resetAt: record.expiresAt,
  };
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}
