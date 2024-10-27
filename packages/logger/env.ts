import { config } from "dotenv"
import { z } from "zod"

config()

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  APP_NAME: z.string({ message: "APP_NAME must be set in .env file" }),

  SEQ_URL: z.string({ message: "SEQ_URL must be set in .env file" }),
  SEQ_API_KEY: z.string({ message: "SEQ_API_KEY must be set in .env file" }),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error(parsedEnv.error.message)
  process.exit(1)
}

export const ENV = parsedEnv.data
export type Env = z.infer<typeof envSchema>
