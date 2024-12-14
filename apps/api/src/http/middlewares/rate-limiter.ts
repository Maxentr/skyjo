import { getConnInfo } from "@hono/node-server/conninfo"
import type { Context, Next } from "hono"
import { RateLimiterMemory } from "rate-limiter-flexible"

const createRateLimiterMiddleware = (rateLimiter: RateLimiterMemory) => {
  return async (c: Context, next: Next) => {
    const ip = getConnInfo(c).remote.address

    if (!ip) {
      return c.json({ error: "IP not found" }, 400)
    }

    try {
      await rateLimiter.consume(ip)
      await next()
    } catch {
      return c.json({ error: "Too Many Requests" }, 429)
    }
  }
}

export { createRateLimiterMiddleware }
