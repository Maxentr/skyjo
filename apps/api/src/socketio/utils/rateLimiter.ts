import type { SkyjoSocket } from "@/socketio/types/skyjoSocket.js"
import { CError, Constants as ErrorConstants } from "@skyjo/error"
import { RateLimiterMemory } from "rate-limiter-flexible"

const consumeSocketRateLimiter = (rateLimiter: RateLimiterMemory) => {
  return async (socket: SkyjoSocket) => {
    try {
      await rateLimiter.consume(socket.id)
    } catch {
      throw new CError("Too Many Requests", {
        code: ErrorConstants.ERROR.TOO_MANY_REQUESTS,
        level: "info",
        meta: {
          socketId: socket.id,
        },
      })
    }
  }
}

export { consumeSocketRateLimiter }
