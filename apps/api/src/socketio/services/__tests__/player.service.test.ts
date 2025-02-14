import { mockRedis, mockSocket } from "@/socketio/services/__tests__/_mock.js"
import { PlayerService } from "@/socketio/services/player.service.js"
import type { SkyjoSocket } from "@/socketio/types/skyjoSocket.js"
import {
  type ConnectionStatus,
  Constants as CoreConstants,
  Skyjo,
  SkyjoCard,
  SkyjoPlayer,
  SkyjoSettings,
} from "@skyjo/core"
import { CError, Constants as ErrorConstants } from "@skyjo/error"
import type { LastGame } from "@skyjo/shared/validations"
import { TEST_SOCKET_ID, TEST_UNKNOWN_GAME_ID } from "@tests/constants-test.js"
import { beforeEach, describe, expect, it, vi } from "vitest"

describe("PlayerService", () => {
  let service: PlayerService
  let socket: SkyjoSocket

  beforeEach(() => {
    service = new PlayerService()
    mockRedis(service)

    socket = mockSocket()
  })
  describe("on leave", () => {
    it("should do nothing if player is not in a game", async () => {
      socket.data.gameCode = TEST_UNKNOWN_GAME_ID

      service["redis"].getGame = vi.fn(() =>
        Promise.reject(
          new CError("", { code: ErrorConstants.ERROR.GAME_NOT_FOUND }),
        ),
      )

      await expect(service.onLeave(socket)).not.toThrowCErrorWithCode(
        ErrorConstants.ERROR.GAME_NOT_FOUND,
      )
    })

    it("should throw if player is not in the game", async () => {
      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socketId132312",
      )
      const game = new Skyjo(opponent.id, new SkyjoSettings(false))
      game.addPlayer(opponent)

      socket.data.gameCode = game.code

      const opponent2 = new SkyjoPlayer(
        { username: "opponent2", avatar: CoreConstants.AVATARS.TURTLE },
        "socketId9887",
      )
      game.addPlayer(opponent2)
      game.start()

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await expect(service.onLeave(socket)).toThrowCErrorWithCode(
        ErrorConstants.ERROR.PLAYER_NOT_FOUND,
      )
    })

    it("should set the player to connection lost", async () => {
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

      game.settings.initialTurnedCount = 0
      game.start()

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await service.onLeave(socket, true)

      expect(player.connectionStatus).toBe<ConnectionStatus>(
        CoreConstants.CONNECTION_STATUS.CONNECTION_LOST,
      )
    })

    it("should remove the player from the game if the game is in lobby", async () => {
      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )
      const game = new Skyjo(opponent.id, new SkyjoSettings(false))
      game.addPlayer(opponent)

      const player = new SkyjoPlayer(
        { username: "player2", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      game.addPlayer(player)
      socket.data.gameCode = game.code
      socket.data.playerId = player.id
      socket.data.playerId = player.id

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await service.onLeave(socket)

      expect(game.isInLobby()).toBeTruthy()
      expect(game.players.length).toBe(1)
    })

    it("should set the player to leave state and let the game goes", async () => {
      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )
      const game = new Skyjo(opponent.id, new SkyjoSettings(false))
      game.addPlayer(opponent)

      const player = new SkyjoPlayer(
        { username: "player2", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      game.addPlayer(player)
      socket.data.gameCode = game.code
      socket.data.playerId = player.id

      const opponent2 = new SkyjoPlayer(
        { username: "opponent2", avatar: CoreConstants.AVATARS.TURTLE },
        "socketId9887",
      )
      game.addPlayer(opponent2)

      game.start()

      player.cards[0][0] = new SkyjoCard(11)
      player.cards[0][1] = new SkyjoCard(11)

      opponent.cards[0][0] = new SkyjoCard(12)
      opponent.cards[0][1] = new SkyjoCard(12)

      opponent2.cards[0][0] = new SkyjoCard(11)
      opponent2.cards[0][1] = new SkyjoCard(11)

      opponent.turnCard(0, 0)
      opponent.turnCard(0, 1)
      opponent2.turnCard(0, 0)
      opponent2.turnCard(0, 1)

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await service.onLeave(socket)

      expect(player.connectionStatus).toBe<ConnectionStatus>(
        CoreConstants.CONNECTION_STATUS.LEAVE,
      )
      expect(game.isPlaying()).toBeTruthy()
      expect(game.players.length).toBe(3)
    })

    it("should remove the player if the game is finished", async () => {
      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )
      const game = new Skyjo(opponent.id, new SkyjoSettings(false))
      game.addPlayer(opponent)

      const player = new SkyjoPlayer(
        { username: "player2", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      game.addPlayer(player)
      socket.data.gameCode = game.code
      socket.data.playerId = player.id

      game.start()

      player.cards[0][0] = new SkyjoCard(11)
      player.cards[0][1] = new SkyjoCard(11)

      opponent.cards[0][0] = new SkyjoCard(12)
      opponent.cards[0][1] = new SkyjoCard(12)

      opponent.turnCard(0, 0)
      opponent.turnCard(0, 1)

      game.roundPhase = CoreConstants.ROUND_PHASE.OVER
      game.status = CoreConstants.GAME_STATUS.FINISHED

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await service.onLeave(socket)

      expect(game.isFinished()).toBeTruthy()
      expect(game.isRoundOver()).toBeTruthy()
      expect(game.players.length).toBe(1)
    })

    it("should disconnect the player after timeout expired and start the game because everyone turned the number of cards to start", async () => {
      vi.useFakeTimers()

      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )
      const game = new Skyjo(opponent.id, new SkyjoSettings(false))
      game.addPlayer(opponent)

      const player = new SkyjoPlayer(
        { username: "player2", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      game.addPlayer(player)
      socket.data.gameCode = game.code
      socket.data.playerId = player.id

      const opponent2 = new SkyjoPlayer(
        { username: "opponent2", avatar: CoreConstants.AVATARS.TURTLE },
        "socketId9887",
      )
      game.addPlayer(opponent2)

      game.start()

      player.cards[0][0] = new SkyjoCard(11)
      player.cards[0][1] = new SkyjoCard(11)

      opponent.cards[0][0] = new SkyjoCard(12)
      opponent.cards[0][1] = new SkyjoCard(12)

      opponent2.cards[0][0] = new SkyjoCard(11)
      opponent2.cards[0][1] = new SkyjoCard(11)

      opponent.turnCard(0, 0)
      opponent.turnCard(0, 1)
      opponent2.turnCard(0, 0)
      opponent2.turnCard(0, 1)

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await service.onLeave(socket)

      expect(player.connectionStatus).toBe<ConnectionStatus>(
        CoreConstants.CONNECTION_STATUS.LEAVE,
      )
      expect(game.isPlaying()).toBeTruthy()
      expect(game.isRoundTurningCards()).toBeTruthy()
      expect(game.players.length).toBe(3)

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))
      vi.runAllTimers()

      const updateGameSpy = vi.spyOn(service["redis"], "updateGame")

      // getting game with changes
      updateGameSpy.mockImplementationOnce(async (game: Skyjo) => {
        expect(player.connectionStatus).toBe<ConnectionStatus>(
          CoreConstants.CONNECTION_STATUS.DISCONNECTED,
        )
        expect(game.isPlaying()).toBeTruthy()
        expect(game.isRoundInMain()).toBeTruthy()
        expect(game.players.length).toBe(3)
      })

      vi.useRealTimers()
    })

    it("should disconnect the player after timeout expired and broadcast the game", async () => {
      vi.useFakeTimers()

      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )
      const game = new Skyjo(opponent.id, new SkyjoSettings(false))
      game.addPlayer(opponent)

      const player = new SkyjoPlayer(
        { username: "player2", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      game.addPlayer(player)
      socket.data.gameCode = game.code
      socket.data.playerId = player.id

      const opponent2 = new SkyjoPlayer(
        { username: "opponent2", avatar: CoreConstants.AVATARS.TURTLE },
        "socketId9887",
      )
      game.addPlayer(opponent2)

      game.settings.initialTurnedCount = 0
      game.start()

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await service.onLeave(socket)

      expect(player.connectionStatus).toBe<ConnectionStatus>(
        CoreConstants.CONNECTION_STATUS.LEAVE,
      )
      expect(game.isPlaying()).toBeTruthy()
      expect(game.isRoundInMain()).toBeTruthy()
      expect(game.players.length).toBe(3)

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))
      vi.runAllTimers()

      const updateGameSpy = vi.spyOn(service["redis"], "updateGame")

      // getting game with changes
      updateGameSpy.mockImplementationOnce(async (game: Skyjo) => {
        expect(player.connectionStatus).toBe<ConnectionStatus>(
          CoreConstants.CONNECTION_STATUS.DISCONNECTED,
        )
        expect(game.isPlaying()).toBeTruthy()
        expect(game.isRoundInMain()).toBeTruthy()
        expect(game.players.length).toBe(3)
      })

      vi.useRealTimers()
    })

    it("should disconnect the player after timeout expired and change who has to play", async () => {
      vi.useFakeTimers()

      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )
      const game = new Skyjo(opponent.id, new SkyjoSettings(false))
      game.addPlayer(opponent)

      const player = new SkyjoPlayer(
        { username: "player2", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      game.addPlayer(player)
      socket.data.gameCode = game.code
      socket.data.playerId = player.id

      const opponent2 = new SkyjoPlayer(
        { username: "opponent2", avatar: CoreConstants.AVATARS.TURTLE },
        "socketId9887",
      )
      game.addPlayer(opponent2)

      game.settings.initialTurnedCount = 0
      game.start()
      game.turn = 1

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await service.onLeave(socket)

      expect(player.connectionStatus).toBe<ConnectionStatus>(
        CoreConstants.CONNECTION_STATUS.LEAVE,
      )
      expect(game.isPlaying()).toBeTruthy()
      expect(game.isRoundInMain()).toBeTruthy()
      expect(game.players.length).toBe(3)
      expect(game.turn).toBe(1)

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))
      vi.runAllTimers()

      const updateGameSpy = vi.spyOn(service["redis"], "updateGame")

      // getting game with changes
      updateGameSpy.mockImplementationOnce(async (game: Skyjo) => {
        expect(player.connectionStatus).toBe<ConnectionStatus>(
          CoreConstants.CONNECTION_STATUS.DISCONNECTED,
        )
        expect(game.isPlaying()).toBeTruthy()
        expect(game.isRoundInMain()).toBeTruthy()
        expect(game.players.length).toBe(3)
        expect(game.turn).toBe(2)
      })

      vi.useRealTimers()
    })

    it("should disconnect the player after timeout expired and stop the game", async () => {
      vi.useFakeTimers()

      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )
      const game = new Skyjo(opponent.id, new SkyjoSettings(false))
      game.addPlayer(opponent)

      const player = new SkyjoPlayer(
        { username: "player2", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      game.addPlayer(player)
      socket.data.gameCode = game.code
      socket.data.playerId = player.id

      game.start()

      player.cards[0][0] = new SkyjoCard(11)
      player.cards[0][1] = new SkyjoCard(11)

      opponent.cards[0][0] = new SkyjoCard(12)
      opponent.cards[0][1] = new SkyjoCard(12)

      opponent.turnCard(0, 0)
      opponent.turnCard(0, 1)

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await service.onLeave(socket)

      expect(player.connectionStatus).toBe<ConnectionStatus>(
        CoreConstants.CONNECTION_STATUS.LEAVE,
      )
      expect(game.isPlaying()).toBeTruthy()
      expect(game.players.length).toBe(2)

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))
      vi.runAllTimers()

      const updateGameSpy = vi.spyOn(service["redis"], "updateGame")

      // getting game with changes
      updateGameSpy.mockImplementationOnce(async (game: Skyjo) => {
        expect(player.connectionStatus).toBe<ConnectionStatus>(
          CoreConstants.CONNECTION_STATUS.DISCONNECTED,
        )
        expect(game.isStopped()).toBeTruthy()
        expect(game.players.length).toBe(2)
      })

      vi.useRealTimers()
    })

    it("should disconnect the player after timeout expired and finish the round and start the next round if all connected players have played their last turn", async () => {
      vi.useFakeTimers()

      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )
      const game = new Skyjo(opponent.id, new SkyjoSettings(false))
      game.addPlayer(opponent)

      const opponent2 = new SkyjoPlayer(
        { username: "player2", avatar: CoreConstants.AVATARS.PENGUIN },
        "socketId9887",
      )
      game.addPlayer(opponent2)

      const player = new SkyjoPlayer(
        { username: "player3", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      game.addPlayer(player)
      socket.data.gameCode = game.code
      socket.data.playerId = player.id

      game.start()

      game.roundPhase = CoreConstants.ROUND_PHASE.LAST_LAP
      game.firstToFinishPlayerId = opponent.id

      opponent.cards = [[new SkyjoCard(1), new SkyjoCard(1)]]
      opponent.hasPlayedLastTurn = true

      opponent2.cards = [[new SkyjoCard(1), new SkyjoCard(1)]]
      opponent2.hasPlayedLastTurn = true

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await service.onLeave(socket)

      expect(player.connectionStatus).toBe<ConnectionStatus>(
        CoreConstants.CONNECTION_STATUS.LEAVE,
      )
      expect(game.isPlaying()).toBeTruthy()
      expect(game.isRoundInLastLap()).toBeTruthy()
      expect(game.players.length).toBe(3)

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))
      vi.runAllTimers()

      const updateGameSpy = vi.spyOn(service["redis"], "updateGame")

      // getting game with changes
      updateGameSpy.mockImplementationOnce(async (game: Skyjo) => {
        expect(player.connectionStatus).toBe<ConnectionStatus>(
          CoreConstants.CONNECTION_STATUS.DISCONNECTED,
        )
        expect(game.isPlaying()).toBeTruthy()
        expect(game.isRoundOver()).toBeTruthy()
        expect(game.roundNumber).toBe(1)
        expect(game.players.length).toBe(3)
      })

      updateGameSpy.mockImplementationOnce(async (game: Skyjo) => {
        expect(game.isPlaying()).toBeTruthy()
        expect(game.isRoundTurningCards()).toBeTruthy()
        expect(game.roundNumber).toBe(2)
        expect(game.players.length).toBe(3)
      })

      vi.useRealTimers()
    })
  })

  describe("on reconnect", () => {
    it("should throw if player cannot reconnect", async () => {
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

      game.settings.initialTurnedCount = 0
      game.start()

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await service.onLeave(socket, true)
      const lastGame: LastGame = {
        gameCode: game.code,
        playerId: player.id,
      }

      service["redis"].canReconnectPlayer = vi.fn(() => Promise.resolve(false))

      await expect(service.onReconnect(socket, lastGame)).toThrowCErrorWithCode(
        ErrorConstants.ERROR.CANNOT_RECONNECT,
      )
    })

    it("should reconnect the player if in the time limit", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      game.addPlayer(player)

      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)

      game.settings.initialTurnedCount = 0
      game.start()

      socket.data = {
        gameCode: game.code,
        playerId: player.id,
      }
      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await service.onLeave(socket, true)

      expect(player.connectionStatus).toBe<ConnectionStatus>(
        CoreConstants.CONNECTION_STATUS.CONNECTION_LOST,
      )

      const lastGame: LastGame = {
        gameCode: game.code,
        playerId: player.id,
      }

      service["redis"].canReconnectPlayer = vi.fn(() => Promise.resolve(true))

      await service.onReconnect(socket, lastGame)

      expect(player.connectionStatus).toBe<ConnectionStatus>(
        CoreConstants.CONNECTION_STATUS.CONNECTED,
      )
    })

    it("should reconnect the player if no time limit", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      game.addPlayer(player)

      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)

      game.settings.initialTurnedCount = 0
      game.start()

      socket.data = {
        gameCode: game.code,
        playerId: player.id,
      }
      const lastGame: LastGame = {
        gameCode: game.code,
        playerId: player.id,
      }

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))
      service["redis"].canReconnectPlayer = vi.fn(() => Promise.resolve(true))

      await service.onReconnect(socket, lastGame)

      expect(player.connectionStatus).toBe<ConnectionStatus>(
        CoreConstants.CONNECTION_STATUS.CONNECTED,
      )
    })
  })

  describe("onRecover", () => {
    it("should throw if game not found and send the error to the client", async () => {
      service["redis"].getGame = vi.fn(() =>
        Promise.reject(
          new CError("", { code: ErrorConstants.ERROR.GAME_NOT_FOUND }),
        ),
      )

      await expect(service.onRecover(socket)).not.toThrowCErrorWithCode(
        ErrorConstants.ERROR.GAME_NOT_FOUND,
      )

      expect(socket.emit).toHaveBeenCalledWith(
        "error:recover",
        ErrorConstants.ERROR.GAME_NOT_FOUND,
      )
    })

    it("should throw if player not found", async () => {
      vi.useFakeTimers()

      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )
      const game = new Skyjo(opponent.id, new SkyjoSettings(false))
      game.addPlayer(opponent)

      const opponent2 = new SkyjoPlayer(
        { username: "player2", avatar: CoreConstants.AVATARS.PENGUIN },
        "socketId9887",
      )
      game.addPlayer(opponent2)

      const player = new SkyjoPlayer(
        { username: "player3", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      game.addPlayer(player)
      socket.data.gameCode = game.code
      socket.data.playerId = crypto.randomUUID()

      game.start()

      opponent.cards = [[new SkyjoCard(1), new SkyjoCard(1)]]
      opponent2.cards = [[new SkyjoCard(1), new SkyjoCard(1)]]

      player.connectionStatus = CoreConstants.CONNECTION_STATUS.CONNECTION_LOST

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await expect(service.onRecover(socket)).toThrowCErrorWithCode(
        ErrorConstants.ERROR.PLAYER_NOT_FOUND,
      )

      expect(player.connectionStatus).toBe<ConnectionStatus>(
        CoreConstants.CONNECTION_STATUS.CONNECTION_LOST,
      )
    })

    it("should set the player as connected and clear the disconnection timeout", async () => {
      vi.useFakeTimers()

      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )
      const game = new Skyjo(opponent.id, new SkyjoSettings(false))
      game.addPlayer(opponent)

      const opponent2 = new SkyjoPlayer(
        { username: "player2", avatar: CoreConstants.AVATARS.PENGUIN },
        "socketId9887",
      )
      game.addPlayer(opponent2)

      const player = new SkyjoPlayer(
        { username: "player3", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      game.addPlayer(player)
      socket.data.gameCode = game.code
      socket.data.playerId = player.id

      game.start()

      opponent.cards = [[new SkyjoCard(1), new SkyjoCard(1)]]
      opponent2.cards = [[new SkyjoCard(1), new SkyjoCard(1)]]

      player.connectionStatus = CoreConstants.CONNECTION_STATUS.CONNECTION_LOST
      setTimeout(() => {
        service["updateGameAfterTimeoutExpired"](socket)
      }, 100000)

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await service.onRecover(socket)
      // run all timers to check if the timeout was cleared
      vi.runAllTimers()

      expect(player.connectionStatus).toBe<ConnectionStatus>(
        CoreConstants.CONNECTION_STATUS.CONNECTED,
      )

      vi.useRealTimers()
    })
  })
})
