import { config } from "dotenv"
import { z } from "zod"

config()

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  APP_NAME: z.string({ message: "APP_NAME must be set in .env file" }),

  SEQ_URL: z.string({ message: "SEQ_URL must be set in .env file" }),
  SEQ_API_KEY: z.string({ message: "SEQ_API_KEY must be set in .env file" }),

  npm_package_version: z.string({
    message:
      "npm_package_version must be set in .env file. Does your package.json have a version?",
  }),
})

export const ENV = envSchema.parse(process.env)
