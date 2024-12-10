import { mockSocket } from "@/socketio/services/__tests__/_mock.js"
import type { SkyjoSocket } from "@/socketio/types/skyjoSocket.js"
import {
  Constants as CoreConstants,
  Skyjo,
  SkyjoPlayer,
  SkyjoSettings,
} from "@skyjo/core"
import { Constants as ErrorConstants } from "@skyjo/error"
import { TEST_SOCKET_ID } from "@tests/constants-test.js"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ChatService } from "../chat.service.js"
import "@skyjo/error/test/expect-extend"

describe("ChatService", () => {
  let service: ChatService
  let socket: SkyjoSocket

  beforeEach(() => {
    service = new ChatService()

    socket = mockSocket()
  })

  it("should be defined", () => {
    expect(ChatService).toBeDefined()
  })

  describe("on message", () => {
    it("should throw if player is not in the game", async () => {
      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )
      const game = new Skyjo(opponent.id, new SkyjoSettings(false))
      game.addPlayer(opponent)

      socket.data.gameCode = game.code

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await expect(
        service.onMessage(socket, { username: "player2", message: "Hello!" }),
      ).toThrowCErrorWithCode(ErrorConstants.ERROR.PLAYER_NOT_FOUND)

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should send a message", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      game.addPlayer(player)
      socket.data.gameCode = game.code
      socket.data.playerId = player.id

      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await service.onMessage(socket, {
        username: "player2",
        message: "Hello!",
      })

      expect(socket.emit).toHaveBeenCalledOnce()
    })
  })
})
