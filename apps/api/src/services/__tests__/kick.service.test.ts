import { mockRedis, mockSocket } from "@/services/__tests__/_mock.js"
import type { SkyjoSocket } from "@/types/skyjoSocket.js"
import {
  Constants as CoreConstants,
  Skyjo,
  SkyjoPlayer,
  SkyjoSettings,
} from "@skyjo/core"
import { Constants as ErrorConstants } from "@skyjo/error"
import { RANDOM_SOCKET_ID, TEST_SOCKET_ID } from "@tests/constants-test.js"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { KickService } from "../kick.service.js"

describe("KickService", () => {
  let service: KickService
  let game: Skyjo

  let player: SkyjoPlayer
  let socket: SkyjoSocket

  let opponent1: SkyjoPlayer
  let opponent1Socket: SkyjoSocket

  let opponent2: SkyjoPlayer

  beforeEach(() => {
    service = new KickService()
    mockRedis(service)

    socket = mockSocket()

    player = new SkyjoPlayer(
      { username: "player", avatar: CoreConstants.AVATARS.BEE },
      TEST_SOCKET_ID,
    )
    opponent1 = new SkyjoPlayer(
      { username: "opponent1", avatar: CoreConstants.AVATARS.CRAB },
      RANDOM_SOCKET_ID(),
    )
    opponent2 = new SkyjoPlayer(
      { username: "opponent2", avatar: CoreConstants.AVATARS.DOG },
      RANDOM_SOCKET_ID(),
    )

    game = new Skyjo(player.socketId, new SkyjoSettings())
    game.addPlayer(player)
    game.addPlayer(opponent1)
    opponent1Socket = mockSocket(opponent1.socketId)
    game.addPlayer(opponent2)

    service["redis"].getGame = vi.fn(() => Promise.resolve(game))

    socket.data = {
      gameCode: game.code,
      playerId: player.id,
    }

    opponent1Socket.data = {
      gameCode: game.code,
      playerId: opponent1.id,
    }
  })

  it("should be defined", () => {
    expect(KickService).toBeDefined()
  })

  describe("initiateKickVote", () => {
    it("should throw if the initiator is not in the game", async () => {
      socket.data.playerId = "NOT-A-PLAYER-ID"

      await expect(
        service.onInitiateKickVote(socket, opponent2.id),
      ).toThrowCErrorWithCode(ErrorConstants.ERROR.PLAYER_NOT_FOUND)
    })

    it("should throw if the targeted player is not in the game", async () => {
      await expect(
        service.onInitiateKickVote(socket, crypto.randomUUID()),
      ).toThrowCErrorWithCode(ErrorConstants.ERROR.PLAYER_NOT_FOUND)
    })

    it("should initiate a kick vote", async () => {
      await service.onInitiateKickVote(socket, opponent2.id)

      expect(service["kickVotes"].get(game.id)).toBeDefined()
    })

    it("should throw if a kick vote already exists for the game", async () => {
      await service.onInitiateKickVote(socket, opponent2.id)

      await expect(
        service.onInitiateKickVote(socket, opponent2.id),
      ).toThrowCErrorWithCode(ErrorConstants.ERROR.KICK_VOTE_IN_PROGRESS)
    })

    it("should check vote status if the kick vote has expired", async () => {
      vi.useFakeTimers()

      await service.onInitiateKickVote(socket, opponent2.id)

      // add 31 seconds
      vi.advanceTimersByTime(31000)

      // expect(service["kickVotes"].get(game.id)).toBeUndefined()

      vi.useRealTimers()
    })
  })

  describe("onVoteToKick", () => {
    it("should throw if the player is not found", async () => {
      socket.data.playerId = "NOT-A-PLAYER-ID"

      await expect(service.onVoteToKick(socket, true)).toThrowCErrorWithCode(
        ErrorConstants.ERROR.PLAYER_NOT_FOUND,
      )
    })

    it("should throw if no kick vote is in progress", async () => {
      await expect(service.onVoteToKick(socket, true)).toThrowCErrorWithCode(
        ErrorConstants.ERROR.NO_KICK_VOTE_IN_PROGRESS,
      )
    })

    it("should throw if the player has already voted", async () => {
      await service.onInitiateKickVote(socket, opponent2.id)

      await expect(service.onVoteToKick(socket, true)).toThrowCErrorWithCode(
        ErrorConstants.ERROR.PLAYER_ALREADY_VOTED,
      )
      expect(service["kickVotes"].get(game.id)?.["votes"].length).toBe(1)
    })

    it("should add a vote to the kick vote and broadcast the vote", async () => {
      await service.onInitiateKickVote(opponent1Socket, opponent2.id)

      const opponent3 = new SkyjoPlayer(
        { username: "opponent3", avatar: CoreConstants.AVATARS.DOG },
        RANDOM_SOCKET_ID(),
      )
      game.addPlayer(opponent3)

      await service.onVoteToKick(socket, true)

      const kickVote = service["kickVotes"].get(game.id)
      expect(kickVote?.["votes"].length).toBe(2)
      expect(socket.emit).toHaveBeenNthCalledWith(
        1,
        "kick:vote",
        expect.objectContaining(kickVote?.toJson()),
      )
    })

    it("should add a vote to the kick vote, try to kick the player but throw because player is not in the game", async () => {
      await service.onInitiateKickVote(opponent1Socket, opponent2.id)

      game.removePlayer(opponent2.id)

      await expect(service.onVoteToKick(socket, true)).toThrowCErrorWithCode(
        ErrorConstants.ERROR.PLAYER_NOT_FOUND,
      )
    })

    it("should add a vote to the kick vote and broadcast the success and change the admin if target is the current admin", async () => {
      game.adminId = opponent2.id
      await service.onInitiateKickVote(socket, opponent2.id)
      await service.onVoteToKick(opponent1Socket, true)

      expect(game.adminId).not.toBe(opponent2.id)
    })

    it("should add a vote to the kick vote, broadcast the success and remove the player if game is in lobby", async () => {
      await service.onInitiateKickVote(opponent1Socket, opponent2.id)

      await service.onVoteToKick(socket, true)

      expect(socket.emit).toHaveBeenNthCalledWith(
        1,
        "kick:vote-success",
        expect.objectContaining({}),
      )

      expect(service["kickVotes"].get(game.id)).toBeUndefined()
      expect(game.players.find((p) => p.id === opponent2.id)).toBeUndefined()
    })

    it("should add a vote to the kick vote, broadcast the success and remove the player if game is finished", async () => {
      game.status = CoreConstants.GAME_STATUS.FINISHED
      await service.onInitiateKickVote(opponent1Socket, opponent2.id)

      await service.onVoteToKick(socket, true)

      expect(socket.emit).toHaveBeenNthCalledWith(
        1,
        "kick:vote-success",
        expect.objectContaining({}),
      )

      expect(service["kickVotes"].get(game.id)).toBeUndefined()
      expect(game.players.find((p) => p.id === opponent2.id)).toBeUndefined()
    })

    it("should add a vote to the kick vote, broadcast the success and remove the player if game is stopped", async () => {
      game.status = CoreConstants.GAME_STATUS.STOPPED
      await service.onInitiateKickVote(opponent1Socket, opponent2.id)

      await service.onVoteToKick(socket, true)

      expect(socket.emit).toHaveBeenNthCalledWith(
        1,
        "kick:vote-success",
        expect.objectContaining({}),
      )

      expect(service["kickVotes"].get(game.id)).toBeUndefined()
      expect(game.players.find((p) => p.id === opponent2.id)).toBeUndefined()
    })

    it("should add a vote to the kick vote, broadcast the success and not remove the player if game is in progress", async () => {
      game.status = CoreConstants.GAME_STATUS.PLAYING

      await service.onInitiateKickVote(opponent1Socket, opponent2.id)

      await service.onVoteToKick(socket, true)

      expect(socket.emit).toHaveBeenNthCalledWith(
        1,
        "kick:vote-success",
        expect.objectContaining({}),
      )

      expect(service["kickVotes"].get(game.id)).toBeUndefined()

      const kickedPlayer = game.players.find((p) => p.id === opponent2.id)
      expect(kickedPlayer).toBeDefined()
      expect(kickedPlayer?.connectionStatus).toBe(
        CoreConstants.CONNECTION_STATUS.DISCONNECTED,
      )
    })

    it("should add a vote to the kick vote and broadcast the failure", async () => {
      game.status = CoreConstants.GAME_STATUS.PLAYING

      await service.onInitiateKickVote(opponent1Socket, opponent2.id)

      await service.onVoteToKick(socket, false)

      expect(socket.emit).toHaveBeenNthCalledWith(
        1,
        "kick:vote-failed",
        expect.objectContaining({}),
      )

      expect(service["kickVotes"].get(game.id)).toBeUndefined()

      const kickedPlayer = game.players.find((p) => p.id === opponent2.id)
      expect(kickedPlayer).toBeDefined()
      expect(kickedPlayer?.connectionStatus).toBe(
        CoreConstants.CONNECTION_STATUS.CONNECTED,
      )
    })
  })
})
