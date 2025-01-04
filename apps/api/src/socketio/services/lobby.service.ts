import { BaseService } from "@/socketio/services/base.service.js"
import type { SkyjoSocket } from "@/socketio/types/skyjoSocket.js"
import { GameStateManager } from "@/socketio/utils/GameStateManager.js"
import {
  type CreatePlayer,
  Skyjo,
  SkyjoPlayer,
  SkyjoSettings,
} from "@skyjo/core"
import { CError, Constants as ErrorConstants } from "@skyjo/error"
import { Logger } from "@skyjo/logger"
import type { UpdateGameSettings } from "@skyjo/shared/validations"

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

  async onResetSettings(socket: SkyjoSocket) {
    const game = await this.redis.getGame(socket.data.gameCode)
    const stateManager = new GameStateManager(game)

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

    if (game.settings.isConfirmed && !game.settings.private) {
      throw new CError(
        `Player try to reset game settings for a public game but the settings are already confirmed.`,
        {
          code: ErrorConstants.ERROR.NOT_ALLOWED,
          level: "warn",
        },
      )
    }

    game.settings = new SkyjoSettings(
      game.settings.private,
      game.settings.maxPlayers,
    )
    game.updatedAt = new Date()

    this.sendGameUpdateToSocketAndRoom(socket, {
      room: game.code,
      stateManager,
    })
    await this.redis.updateGame(game)
  }

  async onUpdateMaxPlayers(socket: SkyjoSocket, maxPlayers: number) {
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

    game.updatedAt = new Date()

    const stateManager = new GameStateManager(game)

    game.settings.maxPlayers = maxPlayers
    game.updatedAt = new Date()

    this.sendGameUpdateToSocketAndRoom(socket, {
      room: game.code,
      stateManager,
    })
    await this.redis.updateGame(game)
  }

  async onUpdateSettings(socket: SkyjoSocket, settings: UpdateGameSettings) {
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

    if (game.settings.isConfirmed && !game.settings.private) {
      throw new CError(
        `Player try to update game settings for a public game but the settings are already confirmed.`,
        {
          code: ErrorConstants.ERROR.NOT_ALLOWED,
          level: "warn",
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

  async onToggleSettingsValidation(socket: SkyjoSocket) {
    const game = await this.redis.getGame(socket.data.gameCode)
    if (game.settings.private) return

    const stateManager = new GameStateManager(game)

    game.settings.isConfirmed = !game.settings.isConfirmed
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
    if (!game.isInLobby()) {
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
