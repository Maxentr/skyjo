import { mockRedis, mockSocket } from "@/socketio/services/__tests__/_mock.js"
import { GameService } from "@/socketio/services/game.service.js"
import type { SkyjoSocket } from "@/socketio/types/skyjoSocket.js"
import {
  Constants as CoreConstants,
  type GameStatus,
  type RoundPhase,
  Skyjo,
  SkyjoCard,
  SkyjoPlayer,
  SkyjoSettings,
  type TurnStatus,
} from "@skyjo/core"
import { CError, Constants as ErrorConstants } from "@skyjo/error"
import { TEST_SOCKET_ID, TEST_UNKNOWN_GAME_ID } from "@tests/constants-test.js"
import { beforeEach, describe, expect, it, vi } from "vitest"

describe("GameService", () => {
  let service: GameService
  let socket: SkyjoSocket

  beforeEach(() => {
    service = new GameService()
    mockRedis(service)

    socket = mockSocket()
  })

  it("should be defined", () => {
    expect(GameService).toBeDefined()
  })

  describe("onGet", () => {
    it("should not get a game if it does not exist", async () => {
      socket.data.gameCode = TEST_UNKNOWN_GAME_ID

      service["redis"].getGame = vi.fn(() =>
        Promise.reject(
          new CError("", { code: ErrorConstants.ERROR.GAME_NOT_FOUND }),
        ),
      )

      const stateVersionOfNonExistingGame = 12
      await expect(
        service.onGet(socket, stateVersionOfNonExistingGame),
      ).toThrowCErrorWithCode(ErrorConstants.ERROR.GAME_NOT_FOUND)

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should not get the game if the client state version is sync with the server", async () => {
      const player = new SkyjoPlayer(
        { username: "player", avatar: CoreConstants.AVATARS.BEE },
        "socketId132312",
      )
      const newGame = new Skyjo(player.id, new SkyjoSettings(false))
      newGame.addPlayer(player)
      socket.data.gameCode = newGame.code

      service["redis"].getGame = vi.fn(() => Promise.resolve(newGame))

      await service.onGet(socket, newGame.stateVersion)

      expect(socket.emit).not.toHaveBeenNthCalledWith(
        1,
        "game",
        newGame.toJson(),
      )
    })

    it("should not get the game if the client state version is ahead of the server", async () => {
      const player = new SkyjoPlayer(
        { username: "player", avatar: CoreConstants.AVATARS.BEE },
        "socketId132312",
      )
      const newGame = new Skyjo(player.id, new SkyjoSettings(false))
      newGame.addPlayer(player)
      socket.data.gameCode = newGame.code

      service["redis"].getGame = vi.fn(() => Promise.resolve(newGame))

      const aheadStateVersion = newGame.stateVersion + 1

      await expect(
        service.onGet(socket, aheadStateVersion),
      ).toThrowCErrorWithCode(ErrorConstants.ERROR.STATE_VERSION_AHEAD)

      expect(socket.emit).toHaveBeenNthCalledWith(1, "game", newGame.toJson())
    })

    it("should get the game if the client state version is behind the server", async () => {
      const player = new SkyjoPlayer(
        { username: "player", avatar: CoreConstants.AVATARS.BEE },
        "socketId132312",
      )
      const newGame = new Skyjo(player.id, new SkyjoSettings(false))
      newGame.addPlayer(player)
      socket.data.gameCode = newGame.code

      service["redis"].getGame = vi.fn(() => Promise.resolve(newGame))

      const behindStateVersion = newGame.stateVersion - 1

      await expect(
        service.onGet(socket, behindStateVersion),
      ).toThrowCErrorWithCode(ErrorConstants.ERROR.STATE_VERSION_BEHIND)

      expect(socket.emit).toHaveBeenNthCalledWith(1, "game", newGame.toJson())
    })
  })

  describe("onRevealCard", () => {
    it("should throw if player is not in the game", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        "socket2131123",
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      game.addPlayer(player)
      socket.data.gameCode = game.code

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: CoreConstants.AVATARS.TURTLE },
        "socketId132312",
      )
      game.addPlayer(opponent)

      await expect(
        service.onRevealCard(socket, { column: 0, row: 0 }, game.stateVersion),
      ).toThrowCErrorWithCode(ErrorConstants.ERROR.PLAYER_NOT_FOUND)

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should throw if game is not started", async () => {
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

      await expect(
        service.onRevealCard(socket, { column: 0, row: 0 }, game.stateVersion),
      ).toThrowCErrorWithCode(ErrorConstants.ERROR.NOT_ALLOWED)

      expect(socket.emit).toHaveBeenNthCalledWith(1, "game", game?.toJson())
    })

    it("should not reveal the card if player already revealed the right card amount", async () => {
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

      socket.data.gameCode = game.code
      socket.data.playerId = player.id

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await service.onRevealCard(
        socket,
        { column: 0, row: 2 },
        game.stateVersion,
      )

      expect(player.hasRevealedCardCount(2)).toBeTruthy()
      expect(game.isPlaying()).toBeTruthy()
      expect(game.isRoundTurningCards()).toBeTruthy()
    })

    it("should reveal the card", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))

      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)

      game.addPlayer(player)
      socket.data.gameCode = game.code
      socket.data.playerId = player.id

      game.start()
      player.turnCard(0, 0)

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await service.onRevealCard(
        socket,
        { column: 0, row: 2 },
        game.stateVersion,
      )

      expect(player.hasRevealedCardCount(2)).toBeTruthy()
      expect(game.isPlaying()).toBeTruthy()
      expect(game.isRoundTurningCards()).toBeTruthy()
    })
  })

  describe("onPickCard", () => {
    it("should throw if player is not in the game", async () => {
      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )
      const game = new Skyjo(opponent.id, new SkyjoSettings(false))
      game.addPlayer(opponent)

      socket.data.gameCode = game.code

      const opponent2 = new SkyjoPlayer(
        { username: "opponent2", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socketId9887",
      )
      game.addPlayer(opponent2)

      game.settings.initialTurnedCount = 0
      game.start()
      game.turn = 0

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await expect(
        service.onPickCard(socket, { pile: "draw" }, game.stateVersion),
      ).toThrowCErrorWithCode(ErrorConstants.ERROR.PLAYER_NOT_FOUND)

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should throw if game is not started", async () => {
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

      await expect(
        service.onPickCard(socket, { pile: "draw" }, game.stateVersion),
      ).toThrowCErrorWithCode(ErrorConstants.ERROR.NOT_ALLOWED)

      expect(socket.emit).toHaveBeenNthCalledWith(1, "game", game?.toJson())
    })

    it("should throw if it's not the player turn", async () => {
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
      game.turn = 1

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await expect(
        service.onPickCard(socket, { pile: "draw" }, game.stateVersion),
      ).toThrowCErrorWithCode(ErrorConstants.ERROR.NOT_ALLOWED)

      expect(socket.emit).toHaveBeenNthCalledWith(1, "game", game?.toJson())
    })

    it("should throw if it's not the waited move", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      socket.data.gameCode = game.code
      socket.data.playerId = player.id
      game.addPlayer(player)

      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)

      game.settings.initialTurnedCount = 0
      game.start()
      game.turn = 0
      game.turnStatus = CoreConstants.TURN_STATUS.REPLACE_A_CARD

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await expect(
        service.onPickCard(socket, { pile: "draw" }, game.stateVersion),
      ).toThrowCErrorWithCode(ErrorConstants.ERROR.INVALID_TURN_STATE)

      expect(socket.emit).toHaveBeenNthCalledWith(1, "game", game?.toJson())
    })

    it("should pick a card from the draw pile", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      socket.data.gameCode = game.code
      socket.data.playerId = player.id
      game.addPlayer(player)

      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)

      game.settings.initialTurnedCount = 0
      game.start()
      game.turn = 0

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await service.onPickCard(socket, { pile: "draw" }, game.stateVersion)

      expect(game.selectedCardValue).not.toBeNull()
      expect(game.turnStatus).toBe<TurnStatus>(
        CoreConstants.TURN_STATUS.THROW_OR_REPLACE,
      )
    })

    it("should pick a card from the discard pile", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      socket.data.gameCode = game.code
      socket.data.playerId = player.id
      game.addPlayer(player)

      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)

      game.settings.initialTurnedCount = 0
      game.start()
      game.turn = 0

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await service.onPickCard(socket, { pile: "discard" }, game.stateVersion)

      expect(socket.emit).toHaveBeenCalledOnce()
      expect(game.selectedCardValue).not.toBeNull()
      expect(game.turnStatus).toBe<TurnStatus>(
        CoreConstants.TURN_STATUS.REPLACE_A_CARD,
      )
    })
  })

  describe("onReplaceCard", () => {
    it("should throw if player is not in the game", async () => {
      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )
      const game = new Skyjo(opponent.id, new SkyjoSettings(false))
      game.addPlayer(opponent)

      socket.data.gameCode = game.code

      const opponent2 = new SkyjoPlayer(
        { username: "opponent2", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socketId9887",
      )
      game.addPlayer(opponent2)

      game.settings.initialTurnedCount = 0
      game.start()
      game.turn = 0

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await expect(
        service.onReplaceCard(socket, { column: 0, row: 2 }, game.stateVersion),
      ).toThrowCErrorWithCode(ErrorConstants.ERROR.PLAYER_NOT_FOUND)

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should throw if game is not started", async () => {
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

      await expect(
        service.onReplaceCard(socket, { column: 0, row: 0 }, game.stateVersion),
      ).toThrowCErrorWithCode(ErrorConstants.ERROR.NOT_ALLOWED)

      expect(socket.emit).toHaveBeenNthCalledWith(1, "game", game?.toJson())
    })

    it("should throw if it's not the player turn", async () => {
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
      game.turn = 1

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await expect(
        service.onReplaceCard(socket, { column: 0, row: 2 }, game.stateVersion),
      ).toThrowCErrorWithCode(ErrorConstants.ERROR.NOT_ALLOWED)

      expect(socket.emit).toHaveBeenNthCalledWith(1, "game", game?.toJson())
    })

    it("should throw if it's not the waited move", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      socket.data.gameCode = game.code
      socket.data.playerId = player.id
      game.addPlayer(player)

      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)

      game.settings.initialTurnedCount = 0
      game.start()
      game.turn = 0
      game.turnStatus = CoreConstants.TURN_STATUS.CHOOSE_A_PILE

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await expect(
        service.onReplaceCard(socket, { column: 0, row: 2 }, game.stateVersion),
      ).toThrowCErrorWithCode(ErrorConstants.ERROR.INVALID_TURN_STATE)

      expect(socket.emit).toHaveBeenNthCalledWith(1, "game", game?.toJson())
    })

    it("should replace a card and finish the turn", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      socket.data.gameCode = game.code
      socket.data.playerId = player.id
      game.addPlayer(player)

      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)
      game.settings.initialTurnedCount = 0
      game.start()
      game.turn = 0
      game.selectedCardValue = 0
      game.turnStatus = CoreConstants.TURN_STATUS.REPLACE_A_CARD

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await service.onReplaceCard(
        socket,
        { column: 0, row: 2 },
        game.stateVersion,
      )

      expect(socket.emit).toHaveBeenCalledTimes(2)
      expect(game.selectedCardValue).toBeNull()
      expect(game.turn).toBe(1)
      expect(game.turnStatus).toBe<TurnStatus>(
        CoreConstants.TURN_STATUS.CHOOSE_A_PILE,
      )
    })
  })

  describe("onDiscardCard", () => {
    it("should throw if player is not in the game", async () => {
      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )
      const game = new Skyjo(opponent.id, new SkyjoSettings(false))
      game.addPlayer(opponent)

      socket.data.gameCode = game.code

      const opponent2 = new SkyjoPlayer(
        { username: "opponent2", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socketId9887",
      )
      game.addPlayer(opponent2)

      game.settings.initialTurnedCount = 0
      game.start()
      game.turn = 0

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await expect(
        service.onDiscardCard(socket, game.stateVersion),
      ).toThrowCErrorWithCode(ErrorConstants.ERROR.PLAYER_NOT_FOUND)

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should throw if game is not started", async () => {
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

      await expect(
        service.onDiscardCard(socket, game.stateVersion),
      ).toThrowCErrorWithCode(ErrorConstants.ERROR.NOT_ALLOWED)

      expect(socket.emit).toHaveBeenNthCalledWith(1, "game", game?.toJson())
    })

    it("should throw if it's not the player turn", async () => {
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
      game.turn = 1

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await expect(
        service.onDiscardCard(socket, game.stateVersion),
      ).toThrowCErrorWithCode(ErrorConstants.ERROR.NOT_ALLOWED)

      expect(socket.emit).toHaveBeenNthCalledWith(1, "game", game?.toJson())
    })

    it("should throw if it's not the waited move", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      socket.data.gameCode = game.code
      socket.data.playerId = player.id
      game.addPlayer(player)

      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)

      game.settings.initialTurnedCount = 0
      game.start()
      game.turn = 0
      game.turnStatus = CoreConstants.TURN_STATUS.CHOOSE_A_PILE
      game.selectedCardValue = 0

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await expect(
        service.onDiscardCard(socket, game.stateVersion),
      ).toThrowCErrorWithCode(ErrorConstants.ERROR.INVALID_TURN_STATE)

      expect(socket.emit).toHaveBeenNthCalledWith(1, "game", game?.toJson())
    })

    it("should discard a card", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      socket.data.gameCode = game.code
      socket.data.playerId = player.id
      game.addPlayer(player)

      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)

      game.settings.initialTurnedCount = 0
      game.start()
      game.turn = 0
      game.turnStatus = CoreConstants.TURN_STATUS.THROW_OR_REPLACE
      game.selectedCardValue = 0

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await service.onDiscardCard(socket, game.stateVersion)

      expect(game.selectedCardValue).toBeNull()
      expect(game.turn).toBe(0)
      expect(game.turnStatus).toBe<TurnStatus>(
        CoreConstants.TURN_STATUS.TURN_A_CARD,
      )
    })
  })

  describe("onTurnCard", () => {
    it("should throw if player is not in the game", async () => {
      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )
      const game = new Skyjo(opponent.id, new SkyjoSettings(false))
      game.addPlayer(opponent)

      socket.data.gameCode = game.code

      const opponent2 = new SkyjoPlayer(
        { username: "opponent2", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socketId9887",
      )
      game.addPlayer(opponent2)

      game.settings.initialTurnedCount = 0
      game.start()
      game.turn = 0

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await expect(
        service.onTurnCard(socket, { column: 0, row: 2 }, game.stateVersion),
      ).toThrowCErrorWithCode(ErrorConstants.ERROR.PLAYER_NOT_FOUND)

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should throw if game is not started", async () => {
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

      await expect(
        service.onTurnCard(socket, { column: 0, row: 0 }, game.stateVersion),
      ).toThrowCErrorWithCode(ErrorConstants.ERROR.NOT_ALLOWED)

      expect(socket.emit).toHaveBeenNthCalledWith(1, "game", game?.toJson())
    })

    it("should throw if it's not player turn", async () => {
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
      game.turn = 1

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await expect(
        service.onTurnCard(socket, { column: 0, row: 2 }, game.stateVersion),
      ).toThrowCErrorWithCode(ErrorConstants.ERROR.NOT_ALLOWED)

      expect(socket.emit).toHaveBeenNthCalledWith(1, "game", game?.toJson())
    })

    it("should throw if it's not the waited move", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      socket.data.gameCode = game.code
      socket.data.playerId = player.id
      game.addPlayer(player)

      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)

      game.settings.initialTurnedCount = 0
      game.start()
      game.turn = 0
      game.turnStatus = CoreConstants.TURN_STATUS.REPLACE_A_CARD

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await expect(
        service.onTurnCard(socket, { column: 0, row: 2 }, game.stateVersion),
      ).toThrowCErrorWithCode(ErrorConstants.ERROR.INVALID_TURN_STATE)

      expect(socket.emit).toHaveBeenNthCalledWith(1, "game", game?.toJson())
    })

    it("should turn a card and finish the turn ", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      socket.data.gameCode = game.code
      socket.data.playerId = player.id
      game.addPlayer(player)

      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)

      game.settings.initialTurnedCount = 0
      game.start()
      game.turn = 0
      game.turnStatus = CoreConstants.TURN_STATUS.TURN_A_CARD

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await service.onTurnCard(socket, { column: 0, row: 2 }, game.stateVersion)

      expect(player.cards[0][2].isVisible).toBeTruthy()
      expect(game.turn).toBe(1)
      expect(game.turnStatus).toBe<TurnStatus>(
        CoreConstants.TURN_STATUS.CHOOSE_A_PILE,
      )
    })

    it("should turn a card, finish the turn and start a new round", async () => {
      vi.useFakeTimers()
      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      socket.data.gameCode = game.code
      socket.data.playerId = player.id
      game.addPlayer(player)

      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)

      game.settings.initialTurnedCount = 0
      game.start()

      player.cards = [[new SkyjoCard(1), new SkyjoCard(1), new SkyjoCard(1)]]
      opponent.cards = [
        [new SkyjoCard(1, true), new SkyjoCard(1, true)],
        [new SkyjoCard(1, true), new SkyjoCard(1, true)],
        [new SkyjoCard(1, true), new SkyjoCard(1, true)],
        [new SkyjoCard(1, true), new SkyjoCard(1, true)],
      ]

      game.turn = 0
      game.roundNumber = 1
      game.firstToFinishPlayerId = opponent.id
      opponent.hasPlayedLastTurn = true
      game.turnStatus = CoreConstants.TURN_STATUS.TURN_A_CARD
      game.roundPhase = CoreConstants.ROUND_PHASE.LAST_LAP

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await service.onTurnCard(socket, { column: 0, row: 2 }, game.stateVersion)

      expect(game.isRoundOver()).toBeTruthy()
      expect(game.isPlaying()).toBeTruthy()

      vi.runAllTimers()

      expect(game.isRoundInMain()).toBeTruthy()
      expect(game.isPlaying()).toBeTruthy()

      vi.useRealTimers()
    })

    it("should turn a card, finish the turn and start a new round when first player to finish is disconnected", async () => {
      vi.useFakeTimers()
      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))

      socket.data.gameCode = game.code
      socket.data.playerId = player.id
      game.addPlayer(player)

      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)

      const opponent2 = new SkyjoPlayer(
        { username: "player3", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socketId113226",
      )
      game.addPlayer(opponent2)

      game.settings.initialTurnedCount = 0
      game.start()

      opponent.cards = [
        [new SkyjoCard(1, true), new SkyjoCard(1, true)],
        [new SkyjoCard(1, true), new SkyjoCard(1, true)],
        [new SkyjoCard(1, true), new SkyjoCard(1, true)],
        [new SkyjoCard(1, true), new SkyjoCard(1, true)],
      ]

      game.turn = 0
      game.roundNumber = 1
      game.firstToFinishPlayerId = opponent.id
      opponent.connectionStatus = CoreConstants.CONNECTION_STATUS.DISCONNECTED
      opponent2.hasPlayedLastTurn = true
      game.turnStatus = CoreConstants.TURN_STATUS.TURN_A_CARD
      game.roundPhase = CoreConstants.ROUND_PHASE.LAST_LAP

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await service.onTurnCard(socket, { column: 0, row: 2 }, game.stateVersion)

      expect(game.isRoundOver()).toBeTruthy()
      expect(game.isPlaying()).toBeTruthy()

      const updateGameSpy = vi.spyOn(service["redis"], "updateGame")
      vi.runAllTimers()

      updateGameSpy.mockImplementationOnce(async (game: Skyjo) => {
        expect(game.isRoundTurningCards()).toBeTruthy()
        expect(game.isPlaying()).toBeTruthy()
      })

      vi.useRealTimers()
    })
  })

  describe("onReplay", () => {
    it("should throw if the game is not finished", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      game.addPlayer(player)

      socket.data.gameCode = game.code
      socket.data.playerId = player.id

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await expect(
        service.onReplay(socket, game.stateVersion),
      ).toThrowCErrorWithCode(ErrorConstants.ERROR.NOT_ALLOWED)

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should ask to replay the game but not restart it", async () => {
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
      game.status = CoreConstants.GAME_STATUS.FINISHED

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await service.onReplay(socket, game.stateVersion)

      expect(socket.emit).toHaveBeenCalledOnce()
      expect(player.wantsReplay).toBeTruthy()
      expect(game.isFinished()).toBeTruthy()
    })

    it("should ask to replay the game and restart it", async () => {
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
      game.status = CoreConstants.GAME_STATUS.FINISHED

      opponent.wantsReplay = true

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await service.onReplay(socket, game.stateVersion)

      expect(socket.emit).toHaveBeenCalledOnce()
      game.players.forEach((player) => {
        expect(player.wantsReplay).toBeFalsy()
      })
      expect(game.isInLobby()).toBeTruthy()
    })
  })
})
