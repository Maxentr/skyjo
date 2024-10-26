import { Constants } from "@/constants.js"
import { GameDb } from "@/db/game.db.js"
import { PlayerDb } from "@/db/player.db.js"
import {
  Constants as CoreConstants,
  type Skyjo,
  type SkyjoPlayer,
} from "@skyjo/core"
import { CError, Constants as ErrorConstants } from "@skyjo/error"
import { Logger } from "@skyjo/logger"
import type { ServerChatMessage } from "@skyjo/shared/types/chat"
import cron from "node-cron"
import type { SkyjoSocket } from "../types/skyjoSocket.js"

export abstract class BaseService {
  private static firstInit = true

  protected static games: Skyjo[] = []
  protected static gameDb = new GameDb()
  protected static playerDb = new PlayerDb()

  constructor() {
    /* istanbul ignore next 3 -- @preserve */
    if (BaseService.firstInit) {
      BaseService.firstInit = false

      this.beforeStart()
    }
  }

  protected async getGame(gameCode: string) {
    let game = BaseService.games.find((game) => game.code === gameCode)

    if (!game) {
      game = await BaseService.gameDb.retrieveGameByCode(gameCode)
      if (!game) {
        throw new CError(
          `Someone try to get game but it doesn't exist in memory nor in database`,
          {
            code: ErrorConstants.ERROR.GAME_NOT_FOUND,
            level: "warn",
            meta: {
              gameCode,
            },
          },
        )
      }

      BaseService.games.push(game)
    }

    return game
  }

  protected async sendGame(socket: SkyjoSocket, game: Skyjo) {
    socket.emit("game", game.toJson())
  }

  protected async broadcastGame(socket: SkyjoSocket, game: Skyjo) {
    await this.sendGame(socket, game)
    socket.to(game.code).emit("game", game.toJson())
  }

  protected async joinGame(
    socket: SkyjoSocket,
    game: Skyjo,
    player: SkyjoPlayer,
    reconnection: boolean = false,
  ) {
    await socket.join(game.code)

    socket.data = {
      gameCode: game.code,
      playerId: player.id,
    }

    socket.emit("join", game.toJson(), player.id)

    const messageType = reconnection
      ? CoreConstants.SERVER_MESSAGE_TYPE.PLAYER_RECONNECT
      : CoreConstants.SERVER_MESSAGE_TYPE.PLAYER_JOINED
    const message: ServerChatMessage = {
      id: crypto.randomUUID(),
      username: player.name,
      message: messageType,
      type: messageType,
    }
    socket.to(game.code).emit("message:server", message)
    socket.emit("message:server", message)

    const updateGame = BaseService.gameDb.updateGame(game)
    const broadcast = this.broadcastGame(socket, game)

    await Promise.all([updateGame, broadcast])
  }

  protected async changeAdmin(game: Skyjo) {
    const players = game.getConnectedPlayers([game.adminId])
    if (players.length === 0) return

    const player = players[0]
    await BaseService.gameDb.updateAdmin(game.id, player.id)

    game.adminId = player.id
  }

  protected async removeGame(gameCode: string) {
    BaseService.games = BaseService.games.filter(
      (game) => game.code !== gameCode,
    )
    await BaseService.gameDb.removeGame(gameCode)
  }

  protected async finishTurn(socket: SkyjoSocket, game: Skyjo) {
    game.nextTurn()
    const player = game.getCurrentPlayer()
    BaseService.playerDb.updatePlayer(player)

    if (
      game.roundStatus === CoreConstants.ROUND_STATUS.OVER &&
      game.status !== CoreConstants.GAME_STATUS.FINISHED
    ) {
      this.restartRound(socket, game)
    }

    const updateGame = BaseService.gameDb.updateGame(game)
    const broadcast = this.broadcastGame(socket, game)

    await Promise.all([updateGame, broadcast])
  }

  protected async restartRound(socket: SkyjoSocket, game: Skyjo) {
    setTimeout(() => {
      game.startNewRound()
      this.broadcastGame(socket, game)
    }, Constants.NEW_ROUND_DELAY)
  }

  //#region private methods
  /* istanbul ignore next function -- @preserve */
  private async beforeStart() {
    await BaseService.gameDb.removeInactiveGames()
    BaseService.games = await BaseService.gameDb.getGamesByRegion()

    this.startCronJob()
  }

  /* istanbul ignore next function -- @preserve */
  private startCronJob() {
    cron.schedule("* * * * *", () => {
      this.removeInactiveGames()
    })
  }

  /* istanbul ignore next function -- @preserve */
  private async removeInactiveGames() {
    Logger.info("Remove inactive games")
    try {
      const deletedGameIds = await BaseService.gameDb.removeInactiveGames()

      BaseService.games = BaseService.games.filter(
        (game) => !deletedGameIds.includes(game.id),
      )
    } catch (error) {
      Logger.error("Error while removing inactive games", {
        error,
      })
    }
  }
  //#endregion
}
