import { vi } from "vitest"
import "@skyjo/error/test/expect-extend"

vi.mock("@skyjo/database/provider", () => ({
  db: {
    query: vi.fn(),
  },
}))

vi.spyOn(process, "env", "get").mockReturnValue({
  NODE_ENV: "test",
  APP_NAME: "skyjo-api",
  ORIGINS: "e",
  GMAIL_EMAIL: "e",
  GMAIL_APP_PASSWORD: "e",
  SEQ_URL: "e",
  SEQ_API_KEY: "e",
  DATABASE_URL: "e",
  REGION: "LOCAL",
  npm_package_version: "-99",
})
