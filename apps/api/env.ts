import { z } from "zod"

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  APP_NAME: z.string({ message: "APP_NAME must be set in .env file" }),
  ORIGINS: z.string({ message: "ORIGINS must be set in .env file" }),

  GMAIL_EMAIL: z.string({ message: "GMAIL_EMAIL must be set in .env file" }),
  GMAIL_APP_PASSWORD: z.string({
    message: "GMAIL_APP_PASSWORD must be set in .env file",
  }),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error(parsedEnv.error.message)
  process.exit(1)
}

export const ENV = parsedEnv.data
export type Env = z.infer<typeof envSchema>
