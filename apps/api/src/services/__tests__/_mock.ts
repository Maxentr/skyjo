import type { BaseService } from "@/services/base.service.js"
import type { SkyjoSocket } from "@/types/skyjoSocket.js"
import { TEST_SOCKET_ID } from "@tests/constants-test.js"
import { vi } from "vitest"

export const mockSocket = (id: string = TEST_SOCKET_ID) => {
  return {
    emit: vi.fn(),
    on: vi.fn(),
    join: vi.fn(),
    to: vi.fn(() => ({ emit: vi.fn() })),
    leave: vi.fn(),
    data: {},
    id,
    connected: true,
    disconnected: false,
    recovered: true,
  } as unknown as SkyjoSocket
}

export const mockRedis = (service: BaseService) => {
  service["redis"].getGame = vi.fn(() =>
    Promise.reject(new Error("This is the default mock of getGame")),
  )
  service["redis"].getPublicGameWithFreePlace = vi.fn(() =>
    Promise.reject(
      new Error("This is the default mock of getPublicGameWithFreePlace"),
    ),
  )
  service["redis"].isPlayerInGame = vi.fn(() =>
    Promise.reject(new Error("This is the default mock of isPlayerInGame")),
  )
  service["redis"].canReconnectPlayer = vi.fn(() =>
    Promise.reject(new Error("This is the default mock of canReconnectPlayer")),
  )

  // these methods doesn't need to be mocked inside tests because they return void
  service["redis"].createGame = vi.fn()
  service["redis"].updateGame = vi.fn()
  service["redis"].updatePlayer = vi.fn()
  service["redis"].updatePlayerSocketId = vi.fn()
  service["redis"].removeGame = vi.fn()
  service["redis"].removePlayer = vi.fn()
}
