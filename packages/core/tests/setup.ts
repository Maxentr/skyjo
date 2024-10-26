import { vi } from "vitest"

vi.mock("database/provider", () => ({
  db: {
    query: vi.fn(),
  },
}))

import "@skyjo/error/test/expect-extend"
