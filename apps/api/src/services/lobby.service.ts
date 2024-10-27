import { BaseService } from "@/services/base.service.js"
import type { SkyjoSocket } from "@/types/skyjoSocket.js"
import {
  Constants as CoreConstants,
  type CreatePlayer,
  Skyjo,
  SkyjoPlayer,
  SkyjoSettings,
} from "@skyjo/core"
import { CError, Constants as ErrorConstants } from "@skyjo/error"
import { Logger } from "@skyjo/logger"
import type { GameSettings } from "@skyjo/shared/validations/updateGameSettings"

export class LobbyService extends BaseService {
  private readonly MAX_GAME_INACTIVE_TIME = 300000 // 5 minutes
  private readonly BASE_NEW_GAME_CHANCE = 0.05 // 5%
  private readonly MAX_NEW_GAME_CHANCE = 0.2 // 20%
  private readonly IDEAL_LOBBY_GAME_COUNT = 3 // Number of lobby wanted at the same time

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

  async onFind(socket: SkyjoSocket, playerToCreate: CreatePlayer) {
    const game = await this.getPublicGameWithFreePlace()

    if (!game) {
      await this.onCreate(socket, playerToCreate, false)
    } else {
      await this.onJoin(socket, game.code, playerToCreate)
    }
  }

  async onUpdateSingleSettings<T extends keyof SkyjoSettings>(
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

    game.settings[key] = value
    game.settings.preventInvalidSettings()

    game.updatedAt = new Date()

    const updateGame = this.redis.updateGame(game)
    const broadcast = this.broadcastGame(socket, game)

    await Promise.all([updateGame, broadcast])
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

    game.settings.updateSettings(settings)

    game.updatedAt = new Date()

    const updateGame = this.redis.updateGame(game)

    const broadcast = this.broadcastGame(socket, game)

    await Promise.all([updateGame, broadcast])
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

    game.start()

    Logger.info(`Game ${game.code} started.`)

    const updateGame = this.redis.updateGame(game)
    const broadcast = this.broadcastGame(socket, game)

    await Promise.all([updateGame, broadcast])
  }

  //#region private methods
  private async createGame(
    socket: SkyjoSocket,
    playerToCreate: CreatePlayer,
    isprotectedGame: boolean,
  ) {
    const player = new SkyjoPlayer(playerToCreate, socket.id)
    const game = new Skyjo(player.id, new SkyjoSettings(isprotectedGame))

    await this.redis.createGame(game)

    return { player, game }
  }

  private async getPublicGameWithFreePlace() {
    const eligibleGames = await this.redis.getPublicGameWithFreePlace()

    // Adjust new game chance based on number of eligible games
    const missingLobbyGameCount = Math.max(
      0,
      this.IDEAL_LOBBY_GAME_COUNT - eligibleGames.length,
    )
    const additionalChance = this.BASE_NEW_GAME_CHANCE * missingLobbyGameCount
    const newGameChance = Math.min(
      this.MAX_NEW_GAME_CHANCE,
      this.BASE_NEW_GAME_CHANCE + additionalChance,
    )

    const shouldCreateNewGame =
      Math.random() < newGameChance || eligibleGames.length === 0
    if (shouldCreateNewGame) return null

    const randomGameIndex = Math.floor(Math.random() * eligibleGames.length)
    return eligibleGames[randomGameIndex]
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

    game.addPlayer(player)
    game.updatedAt = new Date()

    await this.redis.updateGame(game)
  }
  //#endregion
}
