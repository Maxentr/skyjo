import { mockRedis, mockSocket } from "@/services/__tests__/_mock.js"
import { PlayerService } from "@/services/player.service.js"
import type { SkyjoSocket } from "@/types/skyjoSocket.js"
import {
  type ConnectionStatus,
  Constants as CoreConstants,
  type GameStatus,
  type RoundStatus,
  Skyjo,
  SkyjoCard,
  SkyjoPlayer,
  SkyjoSettings,
} from "@skyjo/core"
import { CError, Constants as ErrorConstants } from "@skyjo/error"
import type { LastGame } from "@skyjo/shared/validations/reconnect"
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
      game.start()

      player.turnCard(0, 0)
      player.turnCard(0, 1)
      opponent.turnCard(0, 0)
      opponent.turnCard(0, 1)

      game.checkAllPlayersRevealedCards(game.settings.initialTurnedCount)

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

      expect(game.status).toBe<GameStatus>(CoreConstants.GAME_STATUS.LOBBY)
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
      expect(game.status).toBe<GameStatus>(CoreConstants.GAME_STATUS.PLAYING)
      expect(game.players.length).toBe(3)
    })

    it("should disconnect the player and remove the game if there is no more player", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      game.addPlayer(player)
      socket.data.gameCode = game.code
      socket.data.playerId = player.id

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await service.onLeave(socket)

      expect(game.status).toBe<GameStatus>(CoreConstants.GAME_STATUS.LOBBY)
      expect(game.players.length).toBe(0)
      expect(service["redis"].removeGame).toHaveBeenCalledOnce()
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
      expect(game.status).toBe<GameStatus>(CoreConstants.GAME_STATUS.PLAYING)
      expect(game.roundStatus).toBe<RoundStatus>(
        CoreConstants.ROUND_STATUS.WAITING_PLAYERS_TO_TURN_INITIAL_CARDS,
      )
      expect(game.players.length).toBe(3)

      vi.runAllTimers()

      expect(player.connectionStatus).toBe<ConnectionStatus>(
        CoreConstants.CONNECTION_STATUS.DISCONNECTED,
      )
      expect(game.status).toBe<GameStatus>(CoreConstants.GAME_STATUS.PLAYING)
      expect(game.roundStatus).toBe<RoundStatus>(
        CoreConstants.ROUND_STATUS.PLAYING,
      )
      expect(game.players.length).toBe(3)

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

      game.start()

      player.cards[0][0] = new SkyjoCard(11)
      player.cards[0][1] = new SkyjoCard(11)

      opponent.cards[0][0] = new SkyjoCard(12)
      opponent.cards[0][1] = new SkyjoCard(12)

      opponent2.cards[0][0] = new SkyjoCard(11)
      opponent2.cards[0][1] = new SkyjoCard(11)

      player.turnCard(0, 0)
      player.turnCard(0, 1)
      opponent.turnCard(0, 0)
      opponent.turnCard(0, 1)
      opponent2.turnCard(0, 0)
      opponent2.turnCard(0, 1)

      game.checkAllPlayersRevealedCards(game.settings.initialTurnedCount)

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await service.onLeave(socket)

      expect(player.connectionStatus).toBe<ConnectionStatus>(
        CoreConstants.CONNECTION_STATUS.LEAVE,
      )
      expect(game.status).toBe<GameStatus>(CoreConstants.GAME_STATUS.PLAYING)
      expect(game.roundStatus).toBe<RoundStatus>(
        CoreConstants.ROUND_STATUS.PLAYING,
      )
      expect(game.players.length).toBe(3)

      vi.runAllTimers()

      expect(player.connectionStatus).toBe<ConnectionStatus>(
        CoreConstants.CONNECTION_STATUS.DISCONNECTED,
      )
      expect(game.status).toBe<GameStatus>(CoreConstants.GAME_STATUS.PLAYING)
      expect(game.roundStatus).toBe<RoundStatus>(
        CoreConstants.ROUND_STATUS.PLAYING,
      )
      expect(game.players.length).toBe(3)

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

      game.start()

      player.cards[0][0] = new SkyjoCard(12)
      player.cards[0][1] = new SkyjoCard(12)

      opponent.cards[0][0] = new SkyjoCard(10)
      opponent.cards[0][1] = new SkyjoCard(10)

      opponent2.cards[0][0] = new SkyjoCard(11)
      opponent2.cards[0][1] = new SkyjoCard(11)

      player.turnCard(0, 0)
      player.turnCard(0, 1)
      opponent.turnCard(0, 0)
      opponent.turnCard(0, 1)
      opponent2.turnCard(0, 0)
      opponent2.turnCard(0, 1)

      game.checkAllPlayersRevealedCards(game.settings.initialTurnedCount)

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await service.onLeave(socket)

      expect(player.connectionStatus).toBe<ConnectionStatus>(
        CoreConstants.CONNECTION_STATUS.LEAVE,
      )
      expect(game.status).toBe<GameStatus>(CoreConstants.GAME_STATUS.PLAYING)
      expect(game.roundStatus).toBe<RoundStatus>(
        CoreConstants.ROUND_STATUS.PLAYING,
      )
      expect(game.players.length).toBe(3)
      expect(game.turn).toBe(1)

      vi.runAllTimers()

      expect(player.connectionStatus).toBe<ConnectionStatus>(
        CoreConstants.CONNECTION_STATUS.DISCONNECTED,
      )
      expect(game.status).toBe<GameStatus>(CoreConstants.GAME_STATUS.PLAYING)
      expect(game.roundStatus).toBe<RoundStatus>(
        CoreConstants.ROUND_STATUS.PLAYING,
      )
      expect(game.players.length).toBe(3)
      expect(game.turn).toBe(2)

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
      expect(game.status).toBe<GameStatus>(CoreConstants.GAME_STATUS.PLAYING)
      expect(game.players.length).toBe(2)

      vi.runAllTimers()

      expect(player.connectionStatus).toBe<ConnectionStatus>(
        CoreConstants.CONNECTION_STATUS.DISCONNECTED,
      )
      expect(game.status).toBe<GameStatus>(CoreConstants.GAME_STATUS.STOPPED)
      expect(game.players.length).toBe(2)

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

      game.roundStatus = CoreConstants.ROUND_STATUS.LAST_LAP
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
      expect(game.status).toBe<GameStatus>(CoreConstants.GAME_STATUS.PLAYING)
      expect(game.roundStatus).toBe<RoundStatus>(
        CoreConstants.ROUND_STATUS.LAST_LAP,
      )
      expect(game.players.length).toBe(3)

      vi.runAllTimers()

      expect(player.connectionStatus).toBe<ConnectionStatus>(
        CoreConstants.CONNECTION_STATUS.DISCONNECTED,
      )
      expect(game.status).toBe<GameStatus>(CoreConstants.GAME_STATUS.PLAYING)
      expect(game.roundStatus).toBe<RoundStatus>(
        CoreConstants.ROUND_STATUS.WAITING_PLAYERS_TO_TURN_INITIAL_CARDS,
      )
      expect(game.roundNumber).toBe(2)
      expect(game.players.length).toBe(3)

      vi.useRealTimers()
    })
  })

  describe("on reconnect", () => {
    it("should throw if player is not in a game", async () => {
      const lastGame: LastGame = {
        gameCode: TEST_UNKNOWN_GAME_ID,
        playerId: TEST_SOCKET_ID,
      }

      service["redis"].isPlayerInGame = vi.fn(() => Promise.resolve(false))

      await expect(service.onReconnect(socket, lastGame)).toThrowCErrorWithCode(
        ErrorConstants.ERROR.PLAYER_NOT_FOUND,
      )

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should throw if player is in the game but cannot reconnect", async () => {
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
      game.start()

      player.turnCard(0, 0)
      player.turnCard(0, 1)
      opponent.turnCard(0, 0)
      opponent.turnCard(0, 1)

      game.checkAllPlayersRevealedCards(game.settings.initialTurnedCount)

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await service.onLeave(socket, true)
      const lastGame: LastGame = {
        gameCode: game.code,
        playerId: player.id,
      }

      service["redis"].isPlayerInGame = vi.fn(() => Promise.resolve(true))
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
      game.start()

      player.turnCard(0, 0)
      player.turnCard(0, 1)
      opponent.turnCard(0, 0)
      opponent.turnCard(0, 1)

      game.checkAllPlayersRevealedCards(game.settings.initialTurnedCount)

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

      service["redis"].isPlayerInGame = vi.fn(() => Promise.resolve(true))
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
      game.start()

      player.turnCard(0, 0)
      player.turnCard(0, 1)
      opponent.turnCard(0, 0)
      opponent.turnCard(0, 1)

      game.checkAllPlayersRevealedCards(game.settings.initialTurnedCount)

      socket.data = {
        gameCode: game.code,
        playerId: player.id,
      }
      const lastGame: LastGame = {
        gameCode: game.code,
        playerId: player.id,
      }

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))
      service["redis"].isPlayerInGame = vi.fn(() => Promise.resolve(true))
      service["redis"].canReconnectPlayer = vi.fn(() => Promise.resolve(true))

      await service.onReconnect(socket, lastGame)

      expect(player.connectionStatus).toBe<ConnectionStatus>(
        CoreConstants.CONNECTION_STATUS.CONNECTED,
      )
    })
  })

  describe("onRecover", () => {
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
      player.disconnectionTimeout = setTimeout(() => {
        throw new Error("test")
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
