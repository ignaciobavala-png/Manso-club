// 🔴 ALTO 1 - Rate limiting simple para endpoints de pagos
// Implementación en memoria para MVP (producción debería usar Redis)

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests = new Map<string, RateLimitEntry>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 60 * 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    
    // Limpiar entradas expiradas cada minuto
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }

  private getKey(identifier: string): string {
    return `rate_limit:${identifier}`;
  }

  checkLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const key = this.getKey(identifier);
    const now = Date.now();
    
    let entry = this.requests.get(key);
    
    if (!entry || now > entry.resetTime) {
      // Nueva ventana de tiempo
      entry = {
        count: 1,
        resetTime: now + this.windowMs
      };
      this.requests.set(key, entry);
      
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: entry.resetTime
      };
    }
    
    // Ventana existente
    if (entry.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.resetTime
      };
    }
    
    // Incrementar contador
    entry.count++;
    this.requests.set(key, entry);
    
    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetTime: entry.resetTime
    };
  }

  // Obtener IP de la request (considerando proxies)
  getClientIP(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIP) {
      return realIP;
    }
    
    if (cfConnectingIP) {
      return cfConnectingIP;
    }
    
    // Fallback para desarrollo local
    return 'localhost';
  }
}

// Instancias para diferentes endpoints
export const paymentRateLimit = new RateLimiter(10, 60 * 1000); // 10 requests/minuto para pagos
export const webhookRateLimit = new RateLimiter(100, 60 * 1000); // 100 requests/minuto para webhooks

// Middleware helper para Next.js API routes
export function createRateLimitMiddleware(limiter: RateLimiter) {
  return function rateLimitMiddleware(request: Request) {
    const clientIP = limiter.getClientIP(request);
    const result = limiter.checkLimit(clientIP);
    
    if (!result.allowed) {
      return {
        allowed: false,
        response: new Response(
          JSON.stringify({
            error: 'Too Many Requests',
            message: 'Rate limit exceeded',
            resetTime: result.resetTime
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': limiter['maxRequests'].toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.resetTime.toString(),
              'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
            }
          }
        )
      };
    }
    
    return {
      allowed: true,
      headers: {
        'X-RateLimit-Limit': limiter['maxRequests'].toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetTime.toString()
      }
    };
  };
}
