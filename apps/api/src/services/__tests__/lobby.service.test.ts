import { mockBaseService, mockSocket } from "@/services/__tests__/_mock.js"
import { BaseService } from "@/services/base.service.js"
import { LobbyService } from "@/services/lobby.service.js"
import type { SkyjoSocket } from "@/types/skyjoSocket.js"
import {
  Constants as CoreConstants,
  type CreatePlayer,
  type GameStatus,
  type RoundStatus,
  Skyjo,
  SkyjoPlayer,
  SkyjoSettings,
} from "@skyjo/core"
import { Constants as ErrorConstants } from "@skyjo/error"
import type {
  GameSettings,
  UpdateGameSettings,
} from "@skyjo/shared/validations/updateGameSettings"
import { TEST_SOCKET_ID, TEST_UNKNOWN_GAME_ID } from "@tests/constants-test.js"
import { beforeEach, describe, expect, it, vi } from "vitest"

describe("LobbyService", () => {
  let service: LobbyService
  let socket: SkyjoSocket

  beforeEach(() => {
    mockBaseService()
    service = new LobbyService()

    socket = mockSocket()
  })

  it("should be defined", () => {
    expect(LobbyService).toBeDefined()
  })

  describe("onCreate", () => {
    it("should create a new private game", async () => {
      const player: CreatePlayer = {
        username: "player1",
        avatar: CoreConstants.AVATARS.BEE,
      }

      await service.onCreate(socket, player)

      const game = await service["getGame"](socket.data.gameCode)

      expect(game.settings.private).toBe(true)
      expect(game.players.length).toBe(1)
      expect(socket.emit).toHaveBeenNthCalledWith(
        1,
        "join",
        game.toJson(),
        socket.data.playerId,
      )
    })

    it("should create a new public game", async () => {
      const player: CreatePlayer = {
        username: "player1",
        avatar: CoreConstants.AVATARS.BEE,
      }

      await service.onCreate(socket, player, false)

      const game = await service["getGame"](socket.data.gameCode)

      expect(game.settings.private).toBe(false)
      expect(game.players.length).toBe(1)
      expect(socket.emit).toHaveBeenNthCalledWith(
        1,
        "join",
        game.toJson(),
        socket.data.playerId,
      )
    })
  })

  describe("onJoin", () => {
    it("should throw if it does not exist", async () => {
      socket.data.gameCode = TEST_UNKNOWN_GAME_ID
      const player: CreatePlayer = {
        username: "player1",
        avatar: CoreConstants.AVATARS.BEE,
      }

      await expect(
        service.onJoin(socket, TEST_UNKNOWN_GAME_ID, player),
      ).toThrowCErrorWithCode(ErrorConstants.ERROR.GAME_NOT_FOUND)

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should throw if it's full", async () => {
      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )
      const opponent2 = new SkyjoPlayer(
        { username: "player2", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )

      const game = new Skyjo(opponent.id, new SkyjoSettings(false))
      game.settings.maxPlayers = 2
      BaseService["games"].push(game)

      game.addPlayer(opponent)
      game.addPlayer(opponent2)

      const player: CreatePlayer = {
        username: "player2",
        avatar: CoreConstants.AVATARS.BEE,
      }

      await expect(
        service.onJoin(socket, game.code, player),
      ).toThrowCErrorWithCode(ErrorConstants.ERROR.GAME_IS_FULL)

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("sould throw if game already started", async () => {
      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )
      const opponent2 = new SkyjoPlayer(
        { username: "player2", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )

      const game = new Skyjo(opponent.id, new SkyjoSettings(false))
      BaseService["games"].push(game)

      game.addPlayer(opponent)
      game.addPlayer(opponent2)

      game.start()

      const player: CreatePlayer = {
        username: "player2",
        avatar: CoreConstants.AVATARS.BEE,
      }

      await expect(
        service.onJoin(socket, game.code, player),
      ).toThrowCErrorWithCode(ErrorConstants.ERROR.GAME_ALREADY_STARTED)

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should join the game", async () => {
      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )

      const game = new Skyjo(opponent.id, new SkyjoSettings(false))
      BaseService["games"].push(game)

      game.addPlayer(opponent)

      const player: CreatePlayer = {
        username: "player2",
        avatar: CoreConstants.AVATARS.BEE,
      }

      await service.onJoin(socket, game.code, player)

      expect(game.players.length).toBe(2)
      expect(socket.emit).toHaveBeenNthCalledWith(
        1,
        "join",
        game.toJson(),
        socket.data.playerId,
      )
      expect(socket.emit).toHaveBeenNthCalledWith(
        2,
        "message:server",
        expect.objectContaining({
          type: CoreConstants.SERVER_MESSAGE_TYPE.PLAYER_JOINED,
          username: player.username,
        }),
      )
      expect(socket.emit).toHaveBeenNthCalledWith(3, "game", game.toJson())
    })
  })

  describe("onFind", () => {
    // it("should create a new game if ", async () => {
    //   const player: CreatePlayer = {
    //     username: "player1",
    //     avatar: CoreConstants.AVATARS.BEE,
    //   }

    //   // Create a public game that might be joined
    //   const existingGame = new Skyjo(
    //     "existingPlayerId",
    //     new SkyjoSettings(false),
    //   )
    //   existingGame.addPlayer(
    //     new SkyjoPlayer(
    //       { username: "existingPlayer", avatar: CoreConstants.AVATARS.ELEPHANT },
    //       "existingSocketId",
    //     ),
    //   )
    //   BaseService["games"].push(existingGame)

    //   await service.onFind(socket, player)

    //   const gameCode = socket.data.gameCode
    //   const game = await service["getGame"](gameCode)

    //   expect(gameCode).toBeDefined()
    //   expect(game).toBeDefined()
    //   expect(game.players.length).toBeGreaterThanOrEqual(1)
    //   expect(game.players.length).toBeLessThanOrEqual(2)

    //   if (game.players.length === 1) {
    //     // New game was created
    //     expect(socket.emit).toHaveBeenNthCalledWith(
    //       1,
    //       "join",
    //       game?.toJson(),
    //       game.players[0].id,
    //     )
    //   } else {
    //     // Joined existing game
    //     expect(socket.emit).toHaveBeenNthCalledWith(
    //       1,
    //       "join",
    //       game?.toJson(),
    //       game.players[1].id,
    //     )
    //   }

    //   expect(socket.emit).toHaveBeenNthCalledWith(
    //     2,
    //     "message:server",
    //     expect.objectContaining({
    //       type: CoreConstants.SERVER_MESSAGE_TYPE.PLAYER_JOINED,
    //       username: "player1",
    //     }),
    //   )
    //   expect(socket.emit).toHaveBeenNthCalledWith(
    //     3,
    //     "game",
    //     expect.objectContaining({ code: gameCode }),
    //   )
    // })

    it("should create a new game if no eligible games exist", async () => {
      const player: CreatePlayer = {
        username: "player1",
        avatar: CoreConstants.AVATARS.BEE,
      }

      await service.onFind(socket, player)

      const gameCode = socket.data.gameCode
      const game = await service["getGame"](gameCode)

      expect(gameCode).toBeDefined()
      expect(game.players.length).toBe(1)
      expect(socket.emit).toHaveBeenNthCalledWith(
        1,
        "join",
        game?.toJson(),
        game.players[0].id,
      )
      expect(socket.emit).toHaveBeenNthCalledWith(
        2,
        "message:server",
        expect.objectContaining({
          type: CoreConstants.SERVER_MESSAGE_TYPE.PLAYER_JOINED,
          username: "player1",
        }),
      )
      expect(socket.emit).toHaveBeenNthCalledWith(
        3,
        "game",
        expect.objectContaining({ code: gameCode }),
      )
    })

    it("should join a game if there is at least one eligible game and new game chance is not hit", async () => {
      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )
      const game = new Skyjo(opponent.id, new SkyjoSettings(false))
      game.addPlayer(opponent)
      BaseService["games"].push(game)

      const player: CreatePlayer = {
        username: "player1",
        avatar: CoreConstants.AVATARS.BEE,
      }

      // Math.min is used to calculate the new game chance
      vi.spyOn(Math, "min").mockReturnValue(0)

      await service.onFind(socket, player)

      expect(game.players.length).toBe(2)
      expect(socket.emit).toHaveBeenNthCalledWith(
        1,
        "join",
        game?.toJson(),
        game.players[1].id,
      )

      vi.restoreAllMocks()
    })

    it("should create a new game even if there is at least one eligible game because new game chance is hit", async () => {
      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )
      const otherGame = new Skyjo(opponent.id, new SkyjoSettings(false))
      otherGame.addPlayer(opponent)
      BaseService["games"].push(otherGame)

      const player: CreatePlayer = {
        username: "player1",
        avatar: CoreConstants.AVATARS.BEE,
      }

      // Math.min is used to calculate the new game chance
      vi.spyOn(Math, "min").mockReturnValue(1)

      await service.onFind(socket, player)

      expect(BaseService["games"].length).toBe(2)
      expect(otherGame.players.length).toBe(1)
      expect(socket.emit).toHaveBeenNthCalledWith(
        1,
        "join",
        expect.objectContaining({
          code: socket.data.gameCode,
        }),
        socket.data.playerId,
      )

      vi.restoreAllMocks()
    })
  })

  describe("onUpdateSingleSettings", () => {
    it("should throw if no game is found", async () => {
      socket.data.gameCode = TEST_UNKNOWN_GAME_ID

      await expect(
        service.onUpdateSingleSettings(socket, "private", false),
      ).toThrowCErrorWithCode(ErrorConstants.ERROR.GAME_NOT_FOUND)

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should throw if user is not admin", async () => {
      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )

      const game = new Skyjo(opponent.id, new SkyjoSettings(false))
      BaseService["games"].push(game)

      game.addPlayer(opponent)

      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      game.addPlayer(player)
      socket.data = { gameCode: game.code, playerId: player.id }

      await expect(
        service.onUpdateSingleSettings(socket, "allowSkyjoForColumn", true),
      ).toThrowCErrorWithCode(ErrorConstants.ERROR.NOT_ALLOWED)

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should change the game settings", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      game.addPlayer(player)
      BaseService["games"].push(game)
      socket.data = { gameCode: game.code, playerId: player.id }

      await service.onUpdateSingleSettings(socket, "allowSkyjoForColumn", true)

      expect(game.settings).toBeInstanceOf(SkyjoSettings)
      expect(game.settings.allowSkyjoForColumn).toBeTruthy()
    })
  })

  describe("onSettingsChange", () => {
    it("should throw if no game is found", async () => {
      socket.data.gameCode = TEST_UNKNOWN_GAME_ID

      const newSettings: GameSettings = {
        private: false,
        allowSkyjoForColumn: true,
        allowSkyjoForRow: true,
        initialTurnedCount: 2,
        cardPerRow: 6,
        cardPerColumn: 8,
        scoreToEndGame: 100,
        multiplierForFirstPlayer: 2,
      }

      await expect(
        service.onUpdateSettings(socket, newSettings),
      ).toThrowCErrorWithCode(ErrorConstants.ERROR.GAME_NOT_FOUND)

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should throw if user is not admin", async () => {
      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )

      const game = new Skyjo(opponent.id, new SkyjoSettings(false))
      BaseService["games"].push(game)

      game.addPlayer(opponent)

      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      game.addPlayer(player)
      socket.data = { gameCode: game.code, playerId: player.id }

      const newSettings: GameSettings = {
        private: false,
        allowSkyjoForColumn: true,
        allowSkyjoForRow: true,
        initialTurnedCount: 2,
        cardPerRow: 6,
        cardPerColumn: 8,
        scoreToEndGame: 100,
        multiplierForFirstPlayer: 2,
      }
      await expect(
        service.onUpdateSettings(socket, newSettings),
      ).toThrowCErrorWithCode(ErrorConstants.ERROR.NOT_ALLOWED)

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should change the game settings", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      game.addPlayer(player)
      BaseService["games"].push(game)
      socket.data = { gameCode: game.code, playerId: player.id }

      const newSettings: GameSettings = {
        private: true,
        allowSkyjoForColumn: true,
        allowSkyjoForRow: true,
        initialTurnedCount: 2,
        cardPerRow: 6,
        cardPerColumn: 8,
        scoreToEndGame: 100,
        multiplierForFirstPlayer: 2,
      }
      await service.onUpdateSettings(socket, newSettings)

      expect(game.settings).toBeInstanceOf(SkyjoSettings)
      expect(game.settings.toJson()).toStrictEqual({
        ...newSettings,
        maxPlayers: 8,
      })
    })
  })

  describe("onGameStart", () => {
    it("should throw if the game does not exist", async () => {
      socket.data.gameCode = TEST_UNKNOWN_GAME_ID

      await expect(service.onGameStart(socket)).toThrowCErrorWithCode(
        ErrorConstants.ERROR.GAME_NOT_FOUND,
      )

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should throw if player is not admin", async () => {
      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )
      const game = new Skyjo(opponent.id, new SkyjoSettings(false))
      game.addPlayer(opponent)

      BaseService["games"].push(game)

      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      game.addPlayer(player)
      socket.data.gameCode = game.code
      socket.data.playerId = player.id

      await expect(service.onGameStart(socket)).toThrowCErrorWithCode(
        ErrorConstants.ERROR.NOT_ALLOWED,
      )

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should start the game", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      game.addPlayer(player)
      BaseService["games"].push(game)
      socket.data.gameCode = game.code
      socket.data.playerId = player.id

      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )
      game.addPlayer(opponent)

      await service.onGameStart(socket)

      expect(game.status).toBe<GameStatus>(CoreConstants.GAME_STATUS.PLAYING)
      expect(game.roundStatus).toBe<RoundStatus>(
        CoreConstants.ROUND_STATUS.WAITING_PLAYERS_TO_TURN_INITIAL_CARDS,
      )
    })
  })
})
