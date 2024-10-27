import { config } from "dotenv"
import { z } from "zod"

config()

export const envSchema = z.object({
  REDIS_URL: z.string({ message: "REDIS_URL must be set in .env file" }),
})

export const ENV = envSchema.parse(process.env)