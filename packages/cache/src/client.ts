import { Logger } from "@skyjo/logger"
import { type RedisClientType, createClient } from "redis"
import { ENV } from "../env.js"

export abstract class RedisClient {
  private static instance: RedisClientType | null = null

  protected static async getClient(): Promise<RedisClientType> {
    if (!this.instance) {
      this.instance = createClient({
        url: ENV.REDIS_URL,
        socket: {
          connectTimeout: 5000,
          reconnectStrategy: (retries) => {
            console.log(`Redis reconnect attempt ${retries}`)
            if (retries > 3) {
              console.log("Redis connection failed after 3 retries")
              return new Error("Redis connection failed after 3 retries")
            }
            return Math.min(retries * 100, 3000)
          },
        },
      })

      console.log("test")
      // Add error handling
      this.instance.on("error", (err) => {
        Logger.error("Redis Client Error", { error: err })
        // Cleanup the instance on error
        this.instance = null
      })

      try {
        await this.instance.connect()
      } catch (error) {
        Logger.error("Redis Connection Error", { error })
        this.instance = null
        throw error
      }
    }

    return this.instance
  }

  // Add cleanup method
  public static async disconnect(): Promise<void> {
    if (this.instance) {
      await this.instance.quit()
      this.instance = null
    }
  }
}
