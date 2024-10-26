import { z } from "zod"

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  APP_NAME: z.string({ message: "APP_NAME must be set in .env file" }),
  ORIGINS: z.string({ message: "ORIGINS must be set in .env file" }),

  GMAIL_EMAIL: z.string({ message: "GMAIL_EMAIL must be set in .env file" }),
  GMAIL_APP_PASSWORD: z.string({
    message: "GMAIL_APP_PASSWORD must be set in .env file",
  }),

  DATABASE_URL: z.string({ message: "DATABASE_URL must be set in .env file" }),

  REGION: z.enum(["FR", "LOCAL"]),
})

export const ENV = envSchema.parse(process.env)
export type Env = typeof ENV
