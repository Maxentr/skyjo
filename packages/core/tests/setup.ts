import { vi } from "vitest"

vi.mock("@skyjo/database/provider", () => ({
  db: {
    query: vi.fn(),
  },
}))

import "@skyjo/error/test/expect-extend"
