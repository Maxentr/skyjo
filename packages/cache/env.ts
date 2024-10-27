import { config } from "dotenv"
import { z } from "zod"

config()

export const envSchema = z.object({
  REDIS_URL: z.string({ message: "REDIS_URL must be set in .env file" }),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error(parsedEnv.error.message)
  process.exit(1)
}

export const ENV = parsedEnv.data
export type Env = z.infer<typeof envSchema>
