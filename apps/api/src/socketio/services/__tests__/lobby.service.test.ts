import { mockRedis, mockSocket } from "@/socketio/services/__tests__/_mock.js"
import { LobbyService } from "@/socketio/services/lobby.service.js"
import type { SkyjoSocket } from "@/socketio/types/skyjoSocket.js"
import {
  Constants as CoreConstants,
  type CreatePlayer,
  Skyjo,
  SkyjoPlayer,
  SkyjoSettings,
} from "@skyjo/core"
import { Constants as ErrorConstants } from "@skyjo/error"
import type { UpdateGameSettings } from "@skyjo/shared/validations"
import { TEST_SOCKET_ID } from "@tests/constants-test.js"
import { beforeEach, describe, expect, it, vi } from "vitest"

describe("LobbyService", () => {
  let service: LobbyService
  let socket: SkyjoSocket

  beforeEach(() => {
    service = new LobbyService()
    mockRedis(service)

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

      expect(socket.emit).toHaveBeenCalledWith(
        "game:join",
        socket.data.gameCode,
        CoreConstants.GAME_STATUS.LOBBY,
        socket.data.playerId,
      )
    })

    it("should create a new public game", async () => {
      const player: CreatePlayer = {
        username: "player1",
        avatar: CoreConstants.AVATARS.BEE,
      }

      await service.onCreate(socket, player, false)

      expect(socket.emit).toHaveBeenNthCalledWith(
        1,
        "game:join",
        socket.data.gameCode,
        CoreConstants.GAME_STATUS.LOBBY,
        socket.data.playerId,
      )
    })
  })

  describe("onJoin", () => {
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

      game.addPlayer(opponent)
      game.addPlayer(opponent2)

      const player: CreatePlayer = {
        username: "player2",
        avatar: CoreConstants.AVATARS.BEE,
      }

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

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

      game.addPlayer(opponent)
      game.addPlayer(opponent2)

      game.start()

      const player: CreatePlayer = {
        username: "player2",
        avatar: CoreConstants.AVATARS.BEE,
      }

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

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

      game.addPlayer(opponent)

      const player: CreatePlayer = {
        username: "player2",
        avatar: CoreConstants.AVATARS.BEE,
      }

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await service.onJoin(socket, game.code, player)

      expect(game.players.length).toBe(2)
      expect(socket.emit).toHaveBeenNthCalledWith(
        1,
        "game:join",
        socket.data.gameCode,
        CoreConstants.GAME_STATUS.LOBBY,
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
    })
  })

  describe("onResetSettings", () => {
    it("should throw if user is not admin", async () => {
      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )

      const game = new Skyjo(opponent.id, new SkyjoSettings(false))
      game.addPlayer(opponent)

      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      game.addPlayer(player)
      socket.data = { gameCode: game.code, playerId: player.id }

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await expect(service.onResetSettings(socket)).toThrowCErrorWithCode(
        ErrorConstants.ERROR.NOT_ALLOWED,
      )

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should throw if settings are already confirmed for a public game", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      game.addPlayer(player)

      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )
      game.addPlayer(opponent)
      socket.data = { gameCode: game.code, playerId: player.id }

      game.settings.isConfirmed = true

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await expect(service.onResetSettings(socket)).toThrowCErrorWithCode(
        ErrorConstants.ERROR.NOT_ALLOWED,
      )

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should reset game settings if settings are confirmed for a private game", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(true))
      // custom settings
      game.settings.cardPerColumn = 1
      game.settings.cardPerRow = 1
      game.settings.initialTurnedCount = 1
      game.settings.scoreToEndGame = 1
      game.settings.firstPlayerMultiplierPenalty = 1
      game.settings.allowSkyjoForColumn = true
      game.settings.allowSkyjoForRow = true
      game.settings.maxPlayers = 2

      game.addPlayer(player)

      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )
      game.addPlayer(opponent)
      socket.data = { gameCode: game.code, playerId: player.id }

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await service.onResetSettings(socket)

      expect(game.settings.toJson()).toStrictEqual(
        new SkyjoSettings(true, game.settings.maxPlayers).toJson(),
      )
      expect(socket.emit).toHaveBeenCalled()
    })

    it("should reset game settings", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      game.addPlayer(player)

      socket.data = { gameCode: game.code, playerId: player.id }

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await service.onResetSettings(socket)

      expect(game.settings).toBeInstanceOf(SkyjoSettings)
      expect(game.settings.toJson()).toStrictEqual(
        new SkyjoSettings(false).toJson(),
      )
    })
  })

  describe("onUpdateMaxPlayers", () => {
    it("should throw if user is not admin", async () => {
      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )

      const game = new Skyjo(opponent.id, new SkyjoSettings(false))
      game.addPlayer(opponent)

      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      game.addPlayer(player)
      socket.data = { gameCode: game.code, playerId: player.id }

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await expect(service.onUpdateMaxPlayers(socket, 3)).toThrowCErrorWithCode(
        ErrorConstants.ERROR.NOT_ALLOWED,
      )

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should update max players settings if game is private", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(true))
      game.addPlayer(player)

      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )
      game.addPlayer(opponent)
      socket.data = { gameCode: game.code, playerId: player.id }

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      const newMaxPlayers = 3
      await service.onUpdateMaxPlayers(socket, newMaxPlayers)

      expect(game.settings.toJson()).toStrictEqual({
        ...game.settings.toJson(),
        maxPlayers: newMaxPlayers,
      })

      expect(socket.emit).toHaveBeenCalled()
    })
    it("should update max players settings if game is public and not confirmed", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      game.settings.isConfirmed = false
      game.addPlayer(player)

      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )
      game.addPlayer(opponent)
      socket.data = { gameCode: game.code, playerId: player.id }

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      const newMaxPlayers = 3
      await service.onUpdateMaxPlayers(socket, newMaxPlayers)

      expect(game.settings.toJson()).toStrictEqual({
        ...game.settings.toJson(),
        maxPlayers: newMaxPlayers,
      })

      expect(socket.emit).toHaveBeenCalled()
    })
    it("should update max players settings if game is public and confirmed", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      game.settings.isConfirmed = true
      game.addPlayer(player)

      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )
      game.addPlayer(opponent)
      socket.data = { gameCode: game.code, playerId: player.id }

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      const newMaxPlayers = 3
      await service.onUpdateMaxPlayers(socket, newMaxPlayers)

      expect(game.settings.toJson()).toStrictEqual({
        ...game.settings.toJson(),
        maxPlayers: newMaxPlayers,
      })

      expect(socket.emit).toHaveBeenCalled()
    })
  })

  describe("onUpdateSettings", () => {
    it("should throw if user is not admin", async () => {
      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )

      const game = new Skyjo(opponent.id, new SkyjoSettings(false))
      game.addPlayer(opponent)

      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      game.addPlayer(player)
      socket.data = { gameCode: game.code, playerId: player.id }

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      const newSettings: UpdateGameSettings = {
        allowSkyjoForColumn: true,
        allowSkyjoForRow: true,
        initialTurnedCount: 2,
        cardPerRow: 6,
        cardPerColumn: 8,
        scoreToEndGame: 100,
        firstPlayerMultiplierPenalty: 2,
      }

      await expect(
        service.onUpdateSettings(socket, newSettings),
      ).toThrowCErrorWithCode(ErrorConstants.ERROR.NOT_ALLOWED)

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should throw if settings are already confirmed for a public game", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      game.addPlayer(player)

      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )
      game.addPlayer(opponent)
      socket.data = { gameCode: game.code, playerId: player.id }

      game.settings.isConfirmed = true

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      const newSettings: UpdateGameSettings = {
        scoreToEndGame: 200,
      }

      await expect(
        service.onUpdateSettings(socket, newSettings),
      ).toThrowCErrorWithCode(ErrorConstants.ERROR.NOT_ALLOWED)

      expect(socket.emit).not.toHaveBeenCalled()
    })

    it("should update game settings if settings are confirmed for a private game", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(true))
      game.addPlayer(player)

      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )
      game.addPlayer(opponent)
      socket.data = { gameCode: game.code, playerId: player.id }

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      const newSettings: UpdateGameSettings = {
        scoreToEndGame: 200,
      }

      await service.onUpdateSettings(socket, newSettings)

      expect(game.settings.toJson()).toStrictEqual({
        ...game.settings.toJson(),
        ...newSettings,
      })

      expect(socket.emit).toHaveBeenCalled()
    })

    it("should change one game setting", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      game.addPlayer(player)

      socket.data = { gameCode: game.code, playerId: player.id }

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      const newSettings: UpdateGameSettings = {
        allowSkyjoForColumn: false,
      }

      await service.onUpdateSettings(socket, newSettings)

      expect(game.settings).toBeInstanceOf(SkyjoSettings)
      expect(game.settings.toJson()).toStrictEqual({
        ...game.settings,
        ...newSettings,
        private: game.settings.private,
        maxPlayers: 8,
        isConfirmed: game.settings.isConfirmed,
      })
    })

    it("should change multiple game settings", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      game.addPlayer(player)

      socket.data = { gameCode: game.code, playerId: player.id }

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      const newSettings: UpdateGameSettings = {
        allowSkyjoForColumn: true,
        allowSkyjoForRow: true,
        initialTurnedCount: 2,
        cardPerRow: 6,
        cardPerColumn: 8,
        scoreToEndGame: 100,
        firstPlayerMultiplierPenalty: 2,
      }

      await service.onUpdateSettings(socket, newSettings)

      expect(game.settings).toBeInstanceOf(SkyjoSettings)
      expect(game.settings.toJson()).toStrictEqual({
        ...game.settings,
        ...newSettings,
        private: game.settings.private,
        isConfirmed: game.settings.isConfirmed,
      })
    })
  })

  describe("onToggleSettingsValidation", () => {
    it("should do nothing if game is private", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(true))
      game.addPlayer(player)
      socket.data.gameCode = game.code
      socket.data.playerId = player.id

      expect(game.settings.isConfirmed).toBeTruthy()

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await service.onToggleSettingsValidation(socket)

      expect(game.settings.isConfirmed).toBeTruthy()
    })

    it("should set the settings validation to true", async () => {
      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      const game = new Skyjo(player.id, new SkyjoSettings(false))
      game.addPlayer(player)
      socket.data.gameCode = game.code
      socket.data.playerId = player.id

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await service.onToggleSettingsValidation(socket)

      expect(game.settings.isConfirmed).toBeTruthy()
    })
  })

  describe("onGameStart", () => {
    it("should throw if player is not admin", async () => {
      const opponent = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )
      const game = new Skyjo(opponent.id, new SkyjoSettings(false))
      game.addPlayer(opponent)

      const player = new SkyjoPlayer(
        { username: "player1", avatar: CoreConstants.AVATARS.PENGUIN },
        TEST_SOCKET_ID,
      )
      game.addPlayer(player)
      socket.data.gameCode = game.code
      socket.data.playerId = player.id

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

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
      socket.data.gameCode = game.code
      socket.data.playerId = player.id

      const opponent = new SkyjoPlayer(
        { username: "player2", avatar: CoreConstants.AVATARS.ELEPHANT },
        "socket456",
      )
      game.addPlayer(opponent)

      service["redis"].getGame = vi.fn(() => Promise.resolve(game))

      await service.onGameStart(socket)

      expect(game.isPlaying()).toBeTruthy()
      expect(game.isRoundTurningCards()).toBeTruthy()
    })
  })
})
