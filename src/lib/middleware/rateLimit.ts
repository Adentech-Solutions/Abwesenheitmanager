import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
    count: number;
    resetAt: number;
}

const rateLimiterMap = new Map<string, RateLimitStore>();

// Cleanup expired entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, val] of rateLimiterMap.entries()) {
        if (now > val.resetAt) {
            rateLimiterMap.delete(key);
        }
    }
}, 5 * 60 * 1000);

export function createRateLimiter(options?: {
    windowMs?: number;  // default 60000
    max?: number;       // default 100
}) {
    const windowMs = options?.windowMs || 60000;
    const max = options?.max || 100;

    return async (request: NextRequest): Promise<{ allowed: boolean; remaining: number; resetAt: number }> => {
        // Extract IP (Next.js typical headers for IP)
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous';
        const now = Date.now();

        let record = rateLimiterMap.get(ip);
        
        if (!record || now > record.resetAt) {
            record = { count: 0, resetAt: now + windowMs };
            rateLimiterMap.set(ip, record);
        }

        record.count += 1;
        
        const remaining = Math.max(0, max - record.count);
        const allowed = record.count <= max;
        
        return { allowed, remaining, resetAt: record.resetAt };
    };
}

export function withRateLimit(
    handler: (req: NextRequest, ctx: any) => Promise<NextResponse>,
    options?: { windowMs?: number; max?: number }
) {
    const limiter = createRateLimiter(options);

    return async (req: NextRequest, ctx: any) => {
        const { allowed, remaining, resetAt } = await limiter(req);

        if (!allowed) {
            const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
            return NextResponse.json(
                { error: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.' },
                { 
                    status: 429, 
                    headers: { 
                        'Retry-After': String(retryAfter),
                        'X-RateLimit-Limit': String(options?.max || 100),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000))
                    } 
                }
            );
        }

        const response = await handler(req, ctx);
        
        response.headers.set('X-RateLimit-Limit', String(options?.max || 100));
        response.headers.set('X-RateLimit-Remaining', String(remaining));
        response.headers.set('X-RateLimit-Reset', String(Math.ceil(resetAt / 1000)));
        
        return response;
    };
}
