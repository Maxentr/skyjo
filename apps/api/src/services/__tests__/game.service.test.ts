import { Skyjo } from "@/class/Skyjo"
import { SkyjoCard } from "@/class/SkyjoCard"
import { SkyjoPlayer } from "@/class/SkyjoPlayer"
import { SkyjoSettings } from "@/class/SkyjoSettings"
import { mockBaseService, mockSocket } from "@/services/__tests__/_mock"
import { BaseService } from "@/services/base.service"
import { GameService } from "@/services/game.service"
import { SkyjoSocket } from "@/types/skyjoSocket"
import { TEST_SOCKET_ID, TEST_UNKNOWN_GAME_ID } from "@tests/constants-test"
import {
  AVATARS,
  CONNECTION_STATUS,
  ERROR,
  GAME_STATUS,
  GameStatus,
  ROUND_STATUS,
  RoundStatus,
  TURN_STATUS,
  TurnStatus,
} from "shared/constants"
import { beforeEach, describe, expect, it, vi } from "vitest"

describe("GameService", () => {
  let service: GameService
  let socket: SkyjoSocket

  beforeEach(() => {
    mockBaseService()
    service = new GameService()

    socket = mockSocket()
  })

  it("should be defined", () => {
    expect(GameService).toBeDefined()
  })

  describe("onGet", () => {
    it("should not get a game if it does not exist", async () => {
      socket.data.gameCode = TEST_UNKNOWN_GAME_ID

      await expect(() => service.onGet(socket)).rejects.toThrowError(
        ERROR.GAME_NOT_FOUND,
      )

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should get the game from memory", async () => {
      const player = new SkyjoPlayer(
        { username: "player", avatar: AVATARS.BEE },
        "socketId132312",
      )
      const newGame = new Skyjo(player.id, new SkyjoSettings(false))
      newGame.addPlayer(player)
      BaseService["games"].push(newGame)
      socket.data.gameCode = newGame.code

      const gameCode = newGame.code

      await service.onGet(socket)
      const game = await service["getGame"](gameCode)

      expect(socket.emit).toHaveBeenNthCalledWith(1, "game", game?.toJson())
    })

    it("should get the game from database", async () => {
      const player = new SkyjoPlayer(
        { username: "player", avatar: AVATARS.BEE },
        "socketId132312",
      )
      const newGame = new Skyjo(player.id, new SkyjoSettings(false))
      newGame.addPlayer(player)
      socket.data.gameCode = newGame.code

      // mock the retrieveGameByCode method to return the newGame like if it was in the database
      BaseService["gameDb"].retrieveGameByCode = vi.fn(() =>
        Promise.resolve(newGame),
      )

      await service.onGet(socket)
      const game = await service["getGame"](newGame.code)

      expect(socket.emit).toHaveBeenNthCalledWith(1, "game", game?.toJson())
      expect(BaseService["games"]).toContain(game)
    })
  })

  describe("onRevealCard", () => {
    it("should throw if game does not exist", async () => {
      socket.data.gameCode = TEST_UNKNOWN_GAME_ID

      await expect(() =>
        service.onRevealCard(socket, { column: 0, row: 0 }),
      ).rejects.toThrowError(ERROR.GAME_NOT_FOUND)

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should throw if player is not in the game", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: AVATARS.PENGUIN },
        "socket2131123",
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      game.addPlayer(player)
      socket.data.gameCode = game.code

      BaseService["games"].push(game)

      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: AVATARS.TURTLE },
        "socketId132312",
      )
      game.addPlayer(opponent)

      await expect(() =>
        service.onRevealCard(socket, { column: 0, row: 0 }),
      ).rejects.toThrowError(ERROR.PLAYER_NOT_FOUND)

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should throw if game is not started", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      game.addPlayer(player)
      BaseService["games"].push(game)
      socket.data.gameCode = game.code
      socket.data.playerId = player.id

      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)

      await expect(() =>
        service.onRevealCard(socket, { column: 0, row: 0 }),
      ).rejects.toThrowError(ERROR.NOT_ALLOWED)

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should not reveal the card if player already revealed the right card amount", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      game.addPlayer(player)
      BaseService["games"].push(game)
      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)
      game.start()
      player.turnCard(0, 0)
      player.turnCard(0, 1)

      socket.data.gameCode = game.code
      socket.data.playerId = player.id

      service.onRevealCard(socket, { column: 0, row: 2 })

      expect(player.hasRevealedCardCount(2)).toBeTruthy()
      expect(game.status).toBe<GameStatus>(GAME_STATUS.PLAYING)
      expect(game.roundStatus).toBe<RoundStatus>(
        ROUND_STATUS.WAITING_PLAYERS_TO_TURN_INITIAL_CARDS,
      )
    })

    it("should reveal the card", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      BaseService["games"].push(game)
      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: AVATARS.ELEPHANT },
        "socketId132312",
      )

      game.addPlayer(opponent)

      game.addPlayer(player)
      socket.data.gameCode = game.code
      socket.data.playerId = player.id

      game.start()
      player.turnCard(0, 0)

      await service.onRevealCard(socket, { column: 0, row: 2 })

      expect(player.hasRevealedCardCount(2)).toBeTruthy()
      expect(game.status).toBe<GameStatus>(GAME_STATUS.PLAYING)
      expect(game.roundStatus).toBe<RoundStatus>(
        ROUND_STATUS.WAITING_PLAYERS_TO_TURN_INITIAL_CARDS,
      )
    })
  })

  describe("onPickCard", () => {
    it("should throw if game does not exist", async () => {
      socket.data.gameCode = TEST_UNKNOWN_GAME_ID

      await expect(() =>
        service.onPickCard(socket, { pile: "draw" }),
      ).rejects.toThrowError(ERROR.GAME_NOT_FOUND)

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should throw if player is not in the game", async () => {
      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: AVATARS.ELEPHANT },
        "socket456",
      )
      const game = new Skyjo(opponent.id, new SkyjoSettings(false))
      game.addPlayer(opponent)

      BaseService["games"].push(game)
      socket.data.gameCode = game.code

      const opponent2 = new SkyjoPlayer(
        { username: "opponent2", avatar: AVATARS.ELEPHANT },
        "socketId9887",
      )
      game.addPlayer(opponent2)

      game.start()

      opponent.turnCard(0, 0)
      opponent.turnCard(0, 1)
      opponent2.turnCard(0, 0)
      opponent2.turnCard(0, 1)

      game.checkAllPlayersRevealedCards(game.settings.initialTurnedCount)
      game.turn = 0

      await expect(() =>
        service.onPickCard(socket, { pile: "draw" }),
      ).rejects.toThrowError(ERROR.PLAYER_NOT_FOUND)

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should throw if game is not started", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      game.addPlayer(player)
      BaseService["games"].push(game)
      socket.data.gameCode = game.code
      socket.data.playerId = player.id

      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)

      await expect(() =>
        service.onPickCard(socket, { pile: "draw" }),
      ).rejects.toThrowError(ERROR.NOT_ALLOWED)

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should throw if it's not the player turn", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      game.addPlayer(player)
      BaseService["games"].push(game)
      socket.data.gameCode = game.code
      socket.data.playerId = player.id

      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)

      game.start()

      opponent.turnCard(0, 0)
      opponent.turnCard(0, 1)
      player.turnCard(0, 0)
      player.turnCard(0, 1)
      game.checkAllPlayersRevealedCards(game.settings.initialTurnedCount)

      game.turn = 1

      await expect(() =>
        service.onPickCard(socket, { pile: "draw" }),
      ).rejects.toThrowError("not-your-turn")

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should throw if it's not the waited move", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      socket.data.gameCode = game.code
      socket.data.playerId = player.id
      game.addPlayer(player)
      BaseService["games"].push(game)
      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)
      game.start()

      player.turnCard(0, 0)
      player.turnCard(0, 1)
      opponent.turnCard(0, 0)
      opponent.turnCard(0, 1)

      game.checkAllPlayersRevealedCards(game.settings.initialTurnedCount)
      game.turn = 0
      game.turnStatus = TURN_STATUS.REPLACE_A_CARD

      await expect(() =>
        service.onPickCard(socket, { pile: "draw" }),
      ).rejects.toThrowError(ERROR.INVALID_TURN_STATE)

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should pick a card from the draw pile", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      socket.data.gameCode = game.code
      socket.data.playerId = player.id
      game.addPlayer(player)
      BaseService["games"].push(game)

      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)

      game.start()

      player.turnCard(0, 0)
      player.turnCard(0, 1)
      opponent.turnCard(0, 0)
      opponent.turnCard(0, 1)

      game.checkAllPlayersRevealedCards(game.settings.initialTurnedCount)
      game.turn = 0

      await service.onPickCard(socket, { pile: "draw" })

      expect(game.selectedCardValue).not.toBeNull()
      expect(game.turnStatus).toBe<TurnStatus>(TURN_STATUS.THROW_OR_REPLACE)
    })

    it("should pick a card from the discard pile", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      socket.data.gameCode = game.code
      socket.data.playerId = player.id
      game.addPlayer(player)
      BaseService["games"].push(game)

      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)

      game.start()

      player.turnCard(0, 0)
      player.turnCard(0, 1)
      opponent.turnCard(0, 0)
      opponent.turnCard(0, 1)

      game.checkAllPlayersRevealedCards(game.settings.initialTurnedCount)
      game.turn = 0

      await service.onPickCard(socket, { pile: "discard" })

      expect(socket.emit).toHaveBeenCalledOnce()
      expect(game.selectedCardValue).not.toBeNull()
      expect(game.turnStatus).toBe<TurnStatus>(TURN_STATUS.REPLACE_A_CARD)
    })
  })

  describe("onReplaceCard", () => {
    it("should throw if the game does not exist", async () => {
      socket.data.gameCode = TEST_UNKNOWN_GAME_ID

      await expect(() =>
        service.onReplaceCard(socket, { column: 0, row: 0 }),
      ).rejects.toThrowError(ERROR.GAME_NOT_FOUND)

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should throw if player is not in the game", async () => {
      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: AVATARS.ELEPHANT },
        "socket456",
      )
      const game = new Skyjo(opponent.id, new SkyjoSettings(false))
      game.addPlayer(opponent)

      BaseService["games"].push(game)
      socket.data.gameCode = game.code

      const opponent2 = new SkyjoPlayer(
        { username: "opponent2", avatar: AVATARS.ELEPHANT },
        "socketId9887",
      )
      game.addPlayer(opponent2)

      game.start()

      opponent.turnCard(0, 0)
      opponent.turnCard(0, 1)
      opponent2.turnCard(0, 0)
      opponent2.turnCard(0, 1)

      game.checkAllPlayersRevealedCards(game.settings.initialTurnedCount)
      game.turn = 0

      await expect(() =>
        service.onReplaceCard(socket, { column: 0, row: 2 }),
      ).rejects.toThrowError(ERROR.PLAYER_NOT_FOUND)

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should throw if game is not started", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      game.addPlayer(player)
      BaseService["games"].push(game)
      socket.data.gameCode = game.code
      socket.data.playerId = player.id

      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)

      await expect(() =>
        service.onReplaceCard(socket, { column: 0, row: 0 }),
      ).rejects.toThrowError(ERROR.NOT_ALLOWED)

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should throw if it's not the player turn", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      game.addPlayer(player)
      BaseService["games"].push(game)
      socket.data.gameCode = game.code
      socket.data.playerId = player.id

      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)

      game.start()

      opponent.turnCard(0, 0)
      opponent.turnCard(0, 1)
      player.turnCard(0, 0)
      player.turnCard(0, 1)
      game.checkAllPlayersRevealedCards(game.settings.initialTurnedCount)

      game.turn = 1

      await expect(() =>
        service.onReplaceCard(socket, { column: 0, row: 2 }),
      ).rejects.toThrowError("not-your-turn")

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should throw if it's not the waited move", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      socket.data.gameCode = game.code
      socket.data.playerId = player.id
      game.addPlayer(player)
      BaseService["games"].push(game)
      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)
      game.start()

      player.turnCard(0, 0)
      player.turnCard(0, 1)
      opponent.turnCard(0, 0)
      opponent.turnCard(0, 1)

      game.checkAllPlayersRevealedCards(game.settings.initialTurnedCount)
      game.turn = 0
      game.turnStatus = TURN_STATUS.CHOOSE_A_PILE

      await expect(() =>
        service.onReplaceCard(socket, { column: 0, row: 2 }),
      ).rejects.toThrowError(ERROR.INVALID_TURN_STATE)

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should replace a card and finish the turn", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      socket.data.gameCode = game.code
      socket.data.playerId = player.id
      game.addPlayer(player)
      BaseService["games"].push(game)
      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)
      game.start()

      player.turnCard(0, 0)
      player.turnCard(0, 1)
      opponent.turnCard(0, 0)
      opponent.turnCard(0, 1)

      game.checkAllPlayersRevealedCards(game.settings.initialTurnedCount)
      game.turn = 0
      game.selectedCardValue = 0
      game.turnStatus = TURN_STATUS.REPLACE_A_CARD

      await service.onReplaceCard(socket, { column: 0, row: 2 })

      expect(socket.emit).toHaveBeenCalledTimes(2)
      expect(game.selectedCardValue).toBeNull()
      expect(game.turn).toBe(1)
      expect(game.turnStatus).toBe<TurnStatus>(TURN_STATUS.CHOOSE_A_PILE)
    })
  })

  describe("onDiscardCard", () => {
    it("should throw if the game does not exist", async () => {
      socket.data.gameCode = TEST_UNKNOWN_GAME_ID

      await expect(() => service.onDiscardCard(socket)).rejects.toThrowError(
        ERROR.GAME_NOT_FOUND,
      )

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should throw if player is not in the game", async () => {
      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: AVATARS.ELEPHANT },
        "socket456",
      )
      const game = new Skyjo(opponent.id, new SkyjoSettings(false))
      game.addPlayer(opponent)

      BaseService["games"].push(game)
      socket.data.gameCode = game.code

      const opponent2 = new SkyjoPlayer(
        { username: "opponent2", avatar: AVATARS.ELEPHANT },
        "socketId9887",
      )
      game.addPlayer(opponent2)

      game.start()

      opponent.turnCard(0, 0)
      opponent.turnCard(0, 1)
      opponent2.turnCard(0, 0)
      opponent2.turnCard(0, 1)

      game.checkAllPlayersRevealedCards(game.settings.initialTurnedCount)
      game.turn = 0

      await expect(() => service.onDiscardCard(socket)).rejects.toThrowError(
        ERROR.PLAYER_NOT_FOUND,
      )

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should throw if game is not started", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      game.addPlayer(player)
      BaseService["games"].push(game)
      socket.data.gameCode = game.code
      socket.data.playerId = player.id

      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)

      await expect(() => service.onDiscardCard(socket)).rejects.toThrowError(
        ERROR.NOT_ALLOWED,
      )

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should throw if it's not the player turn", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      game.addPlayer(player)
      BaseService["games"].push(game)
      socket.data.gameCode = game.code
      socket.data.playerId = player.id

      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)

      game.start()

      opponent.turnCard(0, 0)
      opponent.turnCard(0, 1)
      player.turnCard(0, 0)
      player.turnCard(0, 1)
      game.checkAllPlayersRevealedCards(game.settings.initialTurnedCount)

      game.turn = 1

      await expect(() => service.onDiscardCard(socket)).rejects.toThrowError(
        "not-your-turn",
      )

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should throw if it's not the waited move", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      socket.data.gameCode = game.code
      socket.data.playerId = player.id
      game.addPlayer(player)
      BaseService["games"].push(game)
      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)
      game.start()

      player.turnCard(0, 0)
      player.turnCard(0, 1)
      opponent.turnCard(0, 0)
      opponent.turnCard(0, 1)

      game.checkAllPlayersRevealedCards(game.settings.initialTurnedCount)
      game.turn = 0
      game.turnStatus = TURN_STATUS.CHOOSE_A_PILE
      game.selectedCardValue = 0

      await expect(() => service.onDiscardCard(socket)).rejects.toThrowError(
        ERROR.INVALID_TURN_STATE,
      )

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should discard a card", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      socket.data.gameCode = game.code
      socket.data.playerId = player.id
      game.addPlayer(player)
      BaseService["games"].push(game)
      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)
      game.start()

      player.turnCard(0, 0)
      player.turnCard(0, 1)
      opponent.turnCard(0, 0)
      opponent.turnCard(0, 1)

      game.checkAllPlayersRevealedCards(game.settings.initialTurnedCount)
      game.turn = 0
      game.turnStatus = TURN_STATUS.THROW_OR_REPLACE
      game.selectedCardValue = 0

      await service.onDiscardCard(socket)

      expect(game.selectedCardValue).toBeNull()
      expect(game.turn).toBe(0)
      expect(game.turnStatus).toBe<TurnStatus>(TURN_STATUS.TURN_A_CARD)
    })
  })

  describe("onTurnCard", () => {
    it("should throw if the game does not exist", async () => {
      socket.data.gameCode = TEST_UNKNOWN_GAME_ID

      await expect(() =>
        service.onTurnCard(socket, { column: 0, row: 0 }),
      ).rejects.toThrowError(ERROR.GAME_NOT_FOUND)
    })

    it("should throw if player is not in the game", async () => {
      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: AVATARS.ELEPHANT },
        "socket456",
      )
      const game = new Skyjo(opponent.id, new SkyjoSettings(false))
      game.addPlayer(opponent)

      BaseService["games"].push(game)
      socket.data.gameCode = game.code

      const opponent2 = new SkyjoPlayer(
        { username: "opponent2", avatar: AVATARS.ELEPHANT },
        "socketId9887",
      )
      game.addPlayer(opponent2)

      game.start()

      opponent.turnCard(0, 0)
      opponent.turnCard(0, 1)
      opponent2.turnCard(0, 0)
      opponent2.turnCard(0, 1)

      game.checkAllPlayersRevealedCards(game.settings.initialTurnedCount)
      game.turn = 0

      await expect(() =>
        service.onTurnCard(socket, { column: 0, row: 2 }),
      ).rejects.toThrowError(ERROR.PLAYER_NOT_FOUND)

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should throw if game is not started", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      game.addPlayer(player)
      BaseService["games"].push(game)
      socket.data.gameCode = game.code
      socket.data.playerId = player.id

      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)

      await expect(() =>
        service.onTurnCard(socket, { column: 0, row: 0 }),
      ).rejects.toThrowError(ERROR.NOT_ALLOWED)

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should throw if it's not player turn", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      game.addPlayer(player)
      BaseService["games"].push(game)
      socket.data.gameCode = game.code
      socket.data.playerId = player.id

      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)

      game.start()

      opponent.turnCard(0, 0)
      opponent.turnCard(0, 1)
      player.turnCard(0, 0)
      player.turnCard(0, 1)
      game.checkAllPlayersRevealedCards(game.settings.initialTurnedCount)

      game.turn = 1

      await expect(() =>
        service.onTurnCard(socket, { column: 0, row: 2 }),
      ).rejects.toThrowError("not-your-turn")

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should throw if it's not the waited move", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      socket.data.gameCode = game.code
      socket.data.playerId = player.id
      game.addPlayer(player)
      BaseService["games"].push(game)
      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)
      game.start()

      player.turnCard(0, 0)
      player.turnCard(0, 1)
      opponent.turnCard(0, 0)
      opponent.turnCard(0, 1)

      game.checkAllPlayersRevealedCards(game.settings.initialTurnedCount)
      game.turn = 0
      game.turnStatus = TURN_STATUS.REPLACE_A_CARD

      await expect(() =>
        service.onTurnCard(socket, { column: 0, row: 2 }),
      ).rejects.toThrowError(ERROR.INVALID_TURN_STATE)

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should turn a card and finish the turn ", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      socket.data.gameCode = game.code
      socket.data.playerId = player.id
      game.addPlayer(player)
      BaseService["games"].push(game)
      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)
      game.start()

      player.turnCard(0, 0)
      player.turnCard(0, 1)
      opponent.turnCard(0, 0)
      opponent.turnCard(0, 1)

      game.checkAllPlayersRevealedCards(game.settings.initialTurnedCount)
      game.turn = 0
      game.turnStatus = TURN_STATUS.TURN_A_CARD

      await service.onTurnCard(socket, { column: 0, row: 2 })

      expect(player.cards[0][2].isVisible).toBeTruthy()
      expect(game.turn).toBe(1)
      expect(game.turnStatus).toBe<TurnStatus>(TURN_STATUS.CHOOSE_A_PILE)
    })

    it("should turn a card, finish the turn and start a new round", async () => {
      vi.useFakeTimers()
      const player = new SkyjoPlayer(
        { username: "player1", avatar: AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      socket.data.gameCode = game.code
      socket.data.playerId = player.id
      game.addPlayer(player)
      BaseService["games"].push(game)
      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)
      game.start()

      player.cards = [[new SkyjoCard(1), new SkyjoCard(1), new SkyjoCard(1)]]
      player.turnCard(0, 0)
      player.turnCard(0, 1)

      opponent.cards = [[new SkyjoCard(1), new SkyjoCard(1), new SkyjoCard(1)]]
      opponent.turnCard(0, 0)
      opponent.turnCard(0, 1)

      game.checkAllPlayersRevealedCards(game.settings.initialTurnedCount)

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
      game.turnStatus = TURN_STATUS.TURN_A_CARD
      game.roundStatus = ROUND_STATUS.LAST_LAP

      await service.onTurnCard(socket, { column: 0, row: 2 })

      expect(game.roundStatus).toBe<RoundStatus>(ROUND_STATUS.OVER)
      expect(game.status).toBe<GameStatus>(GAME_STATUS.PLAYING)

      vi.runAllTimers()

      expect(game.roundStatus).toBe<RoundStatus>(
        ROUND_STATUS.WAITING_PLAYERS_TO_TURN_INITIAL_CARDS,
      )
      expect(game.status).toBe<GameStatus>(GAME_STATUS.PLAYING)

      vi.useRealTimers()
    })

    it("should turn a card, finish the turn and start a new round when first player to finish is disconnected", async () => {
      vi.useFakeTimers()
      const player = new SkyjoPlayer(
        { username: "player1", avatar: AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      BaseService["games"].push(game)

      socket.data.gameCode = game.code
      socket.data.playerId = player.id
      game.addPlayer(player)

      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)

      const opponent2 = new SkyjoPlayer(
        { username: "player3", avatar: AVATARS.ELEPHANT },
        "socketId113226",
      )
      game.addPlayer(opponent2)

      game.start()

      player.turnCard(0, 0)
      player.turnCard(0, 1)
      opponent.turnCard(0, 0)
      opponent.turnCard(0, 1)

      game.checkAllPlayersRevealedCards(game.settings.initialTurnedCount)

      opponent.cards = [
        [new SkyjoCard(1, true), new SkyjoCard(1, true)],
        [new SkyjoCard(1, true), new SkyjoCard(1, true)],
        [new SkyjoCard(1, true), new SkyjoCard(1, true)],
        [new SkyjoCard(1, true), new SkyjoCard(1, true)],
      ]

      game.turn = 0
      game.roundNumber = 1
      game.firstToFinishPlayerId = opponent.id
      opponent.connectionStatus = CONNECTION_STATUS.DISCONNECTED
      opponent2.hasPlayedLastTurn = true
      game.turnStatus = TURN_STATUS.TURN_A_CARD
      game.roundStatus = ROUND_STATUS.LAST_LAP

      await service.onTurnCard(socket, { column: 0, row: 2 })

      expect(game.roundStatus).toBe<RoundStatus>(ROUND_STATUS.OVER)
      expect(game.status).toBe<GameStatus>(GAME_STATUS.PLAYING)

      vi.runAllTimers()

      expect(game.roundStatus).toBe<RoundStatus>(
        ROUND_STATUS.WAITING_PLAYERS_TO_TURN_INITIAL_CARDS,
      )
      expect(game.status).toBe<GameStatus>(GAME_STATUS.PLAYING)

      vi.useRealTimers()
    })
  })

  describe("onReplay", () => {
    it("should throw if it does not exist", async () => {
      socket.data.gameCode = TEST_UNKNOWN_GAME_ID

      await expect(() => service.onReplay(socket)).rejects.toThrowError(
        ERROR.GAME_NOT_FOUND,
      )

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should throw if the game is not finished", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      game.addPlayer(player)
      BaseService["games"].push(game)
      socket.data.gameCode = game.code
      socket.data.playerId = player.id

      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)
      game.start()

      player.turnCard(0, 0)
      player.turnCard(0, 1)
      opponent.turnCard(0, 0)
      opponent.turnCard(0, 1)

      game.checkAllPlayersRevealedCards(game.settings.initialTurnedCount)
      game.turn = 0
      game.turnStatus = TURN_STATUS.CHOOSE_A_PILE

      await expect(() => service.onReplay(socket)).rejects.toThrowError(
        ERROR.NOT_ALLOWED,
      )

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should ask to replay the game but not restart it", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      game.addPlayer(player)
      BaseService["games"].push(game)
      socket.data.gameCode = game.code
      socket.data.playerId = player.id

      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)
      game.start()

      player.turnCard(0, 0)
      player.turnCard(0, 1)
      opponent.turnCard(0, 0)
      opponent.turnCard(0, 1)

      game.checkAllPlayersRevealedCards(game.settings.initialTurnedCount)
      game.status = GAME_STATUS.FINISHED

      await service.onReplay(socket)

      expect(socket.emit).toHaveBeenCalledOnce()
      expect(player.wantsReplay).toBeTruthy()
      expect(game.status).toBe<GameStatus>(GAME_STATUS.FINISHED)
    })

    it("should ask to replay the game and restart it", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      game.addPlayer(player)
      BaseService["games"].push(game)
      socket.data.gameCode = game.code
      socket.data.playerId = player.id

      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: AVATARS.ELEPHANT },
        "socketId132312",
      )
      game.addPlayer(opponent)
      game.start()

      player.turnCard(0, 0)
      player.turnCard(0, 1)
      opponent.turnCard(0, 0)
      opponent.turnCard(0, 1)

      game.checkAllPlayersRevealedCards(game.settings.initialTurnedCount)
      game.status = GAME_STATUS.FINISHED

      opponent.wantsReplay = true

      await service.onReplay(socket)

      expect(socket.emit).toHaveBeenCalledOnce()
      game.players.forEach((player) => {
        expect(player.wantsReplay).toBeFalsy()
      })
      expect(game.status).toBe<GameStatus>(GAME_STATUS.LOBBY)
    })
  })
})
