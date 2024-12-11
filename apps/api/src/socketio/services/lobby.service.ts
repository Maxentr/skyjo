import { BaseService } from "@/socketio/services/base.service.js"
import type { SkyjoSocket } from "@/socketio/types/skyjoSocket.js"
import { GameStateManager } from "@/socketio/utils/GameStateManager.js"
import {
  Constants as CoreConstants,
  type CreatePlayer,
  Skyjo,
  SkyjoPlayer,
  SkyjoSettings,
} from "@skyjo/core"
import { CError, Constants as ErrorConstants } from "@skyjo/error"
import { Logger } from "@skyjo/logger"
import type { GameSettings } from "@skyjo/shared/validations"

export class LobbyService extends BaseService {
  async onCreate(
    socket: SkyjoSocket,
    playerToCreate: CreatePlayer,
    isPrivateGame = true,
  ) {
    const { game, player } = await this.createGame(
      socket,
      playerToCreate,
      isPrivateGame,
    )

    await this.addPlayerToGame(socket, game, player)
    await this.joinGame(socket, game, player)
  }

  async onJoin(
    socket: SkyjoSocket,
    gameCode: string,
    playerToCreate: CreatePlayer,
  ) {
    const game = await this.redis.getGame(gameCode)

    const player = new SkyjoPlayer(playerToCreate, socket.id)

    await this.addPlayerToGame(socket, game, player)
    await this.joinGame(socket, game, player)
  }

  async onUpdateSingleSettings<T extends keyof Omit<SkyjoSettings, "private">>(
    socket: SkyjoSocket,
    key: T,
    value: SkyjoSettings[T],
  ) {
    const game = await this.redis.getGame(socket.data.gameCode)
    if (!game.isAdmin(socket.data.playerId)) {
      throw new CError(
        `Player try to change game settings ${key} but is not the admin.`,
        {
          code: ErrorConstants.ERROR.NOT_ALLOWED,
          level: "warn",
          meta: {
            game,
            socket,
            gameCode: game.code,
            playerId: socket.data.playerId,
          },
        },
      )
    }

    const stateManager = new GameStateManager(game)

    game.settings[key] = value
    game.settings.preventInvalidSettings()

    game.updatedAt = new Date()

    this.sendGameUpdateToSocketAndRoom(socket, {
      room: game.code,
      stateManager,
    })
    await this.redis.updateGame(game)
  }

  async onUpdateSettings(socket: SkyjoSocket, settings: GameSettings) {
    const game = await this.redis.getGame(socket.data.gameCode)
    if (!game.isAdmin(socket.data.playerId)) {
      throw new CError(
        `Player try to change all game settings but is not the admin.`,
        {
          code: ErrorConstants.ERROR.NOT_ALLOWED,
          level: "warn",
          meta: {
            game,
            socket,
            gameCode: game.code,
            playerId: socket.data.playerId,
          },
        },
      )
    }

    const stateManager = new GameStateManager(game)

    game.settings.updateSettings(settings)

    game.updatedAt = new Date()

    this.sendGameUpdateToSocketAndRoom(socket, {
      room: game.code,
      stateManager,
    })
    await this.redis.updateGame(game)
  }

  async onGameStart(socket: SkyjoSocket) {
    const game = await this.redis.getGame(socket.data.gameCode)
    if (!game.isAdmin(socket.data.playerId)) {
      throw new CError(`Player try to start the game but is not the admin.`, {
        code: ErrorConstants.ERROR.NOT_ALLOWED,
        level: "warn",
        meta: {
          game,
          socket,
          gameCode: game.code,
          playerId: socket.data.playerId,
        },
      })
    }

    const stateManager = new GameStateManager(game)

    game.start()

    Logger.info(`Game ${game.code} started.`)

    this.sendGameUpdateToSocketAndRoom(socket, {
      room: game.code,
      stateManager,
    })
    await this.redis.updateGame(game)
  }

  //#region private methods
  private async createGame(
    socket: SkyjoSocket,
    playerToCreate: CreatePlayer,
    isPrivateGame: boolean,
  ) {
    const player = new SkyjoPlayer(playerToCreate, socket.id)
    const game = new Skyjo(player.id, new SkyjoSettings(isPrivateGame))

    await this.redis.createGame(game)

    return { player, game }
  }

  private async addPlayerToGame(
    socket: SkyjoSocket,
    game: Skyjo,
    player: SkyjoPlayer,
  ) {
    if (game.status !== CoreConstants.GAME_STATUS.LOBBY) {
      throw new CError(
        `Player try to join a game but the game is not in the lobby.`,
        {
          code: ErrorConstants.ERROR.GAME_ALREADY_STARTED,
          level: "warn",
          meta: {
            game,
            socket,
            player,
            gameCode: game.code,
            playerId: socket.data.playerId,
          },
        },
      )
    }

    const stateManager = new GameStateManager(game)

    game.addPlayer(player)
    game.updatedAt = new Date()

    this.sendGameUpdateToRoom(socket, {
      room: game.code,
      stateManager,
    })
    await this.redis.updateGame(game)
  }
  //#endregion
}