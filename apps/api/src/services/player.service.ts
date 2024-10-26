import type { SkyjoSocket } from "@/types/skyjoSocket.js"
import { socketErrorHandlerWrapper } from "@/utils/socketErrorHandlerWrapper.js"
import {
  Constants as CoreConstants,
  type Skyjo,
  type SkyjoPlayer,
} from "@skyjo/core"
import { CError, Constants as ErrorConstants } from "@skyjo/error"
import { Constants as SharedConstants } from "@skyjo/shared/constants"
import type { LastGame } from "@skyjo/shared/validations/reconnect"
import { BaseService } from "./base.service.js"

export class PlayerService extends BaseService {
  async onLeave(socket: SkyjoSocket, timeout: boolean = false) {
    try {
      const game = await this.getGame(socket.data.gameCode)

      const player = game.getPlayerById(socket.data.playerId)
      if (!player) {
        throw new CError(
          `Player try to leave a game but he has not been found.`,
          {
            code: ErrorConstants.ERROR.PLAYER_NOT_FOUND,
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

      player.connectionStatus = timeout
        ? CoreConstants.CONNECTION_STATUS.CONNECTION_LOST
        : CoreConstants.CONNECTION_STATUS.LEAVE

      await BaseService.playerDb.updatePlayer(player)

      if (game.isAdmin(player.id)) await this.changeAdmin(game)

      if (
        game.status === CoreConstants.GAME_STATUS.LOBBY ||
        game.status === CoreConstants.GAME_STATUS.FINISHED ||
        game.status === CoreConstants.GAME_STATUS.STOPPED
      ) {
        game.removePlayer(player.id)
        await BaseService.playerDb.removePlayer(game.id, player.id)

        game.restartGameIfAllPlayersWantReplay()

        const promises: Promise<void>[] = []

        if (game.getConnectedPlayers().length === 0) {
          const removeGame = this.removeGame(game.code)
          promises.push(removeGame)
        } else {
          const updateGame = BaseService.gameDb.updateGame(game)
          promises.push(updateGame)
        }

        const broadcast = this.broadcastGame(socket, game)
        promises.push(broadcast)

        await Promise.all(promises)
      } else {
        this.startDisconnectionTimeout(player, timeout, () =>
          this.updateGameAfterTimeoutExpired(socket, game),
        )
      }

      socket.to(game.code).emit("message:server", {
        id: crypto.randomUUID(),
        username: player.name,
        message: CoreConstants.SERVER_MESSAGE_TYPE.PLAYER_LEFT,
        type: CoreConstants.SERVER_MESSAGE_TYPE.PLAYER_LEFT,
      })

      await socket.leave(game.code)
    } catch (error) {
      // If the game is not found, it means the player wasn't in a game so we don't need to do anything
      if (
        error instanceof CError &&
        error.code === ErrorConstants.ERROR.GAME_NOT_FOUND
      ) {
        return
      } else {
        throw error
      }
    }
  }

  async onReconnect(socket: SkyjoSocket, reconnectData: LastGame) {
    const isPlayerInGame = await BaseService.gameDb.isPlayerInGame(
      reconnectData.gameCode,
      reconnectData.playerId,
    )
    if (!isPlayerInGame) {
      throw new CError(
        `Player try to reconnect but he has not been found in the game.`,
        {
          code: ErrorConstants.ERROR.PLAYER_NOT_FOUND,
          level: "warn",
          meta: {
            socket,
            gameCode: reconnectData.gameCode,
            playerId: reconnectData.playerId,
          },
        },
      )
    }

    const canReconnect = await BaseService.playerDb.canReconnect(
      reconnectData.playerId,
    )
    if (!canReconnect) {
      throw new CError(`Player try to reconnect but he cannot reconnect.`, {
        code: ErrorConstants.ERROR.CANNOT_RECONNECT,
        level: "warn",
        meta: {
          socket,
          gameCode: reconnectData.gameCode,
          playerId: reconnectData.playerId,
        },
      })
    }

    await BaseService.playerDb.updateSocketId(reconnectData.playerId, socket.id)

    await this.reconnectPlayer(
      socket,
      reconnectData.gameCode,
      reconnectData.playerId,
    )
  }

  async onRecover(socket: SkyjoSocket) {
    await this.reconnectPlayer(
      socket,
      socket.data.gameCode,
      socket.data.playerId,
    )
  }

  //#region private methods
  private startDisconnectionTimeout(
    player: SkyjoPlayer,
    connectionLost: boolean,
    callback: (...args: unknown[]) => Promise<void>,
  ) {
    player.connectionStatus = connectionLost
      ? CoreConstants.CONNECTION_STATUS.CONNECTION_LOST
      : CoreConstants.CONNECTION_STATUS.LEAVE
    BaseService.playerDb.updateDisconnectionDate(player, new Date())

    player.disconnectionTimeout = setTimeout(
      socketErrorHandlerWrapper(async () => {
        player.connectionStatus = CoreConstants.CONNECTION_STATUS.DISCONNECTED
        await callback()
      }),
      connectionLost
        ? SharedConstants.CONNECTION_LOST_TIMEOUT_IN_MS
        : SharedConstants.LEAVE_TIMEOUT_IN_MS,
    )
  }

  private async updateGameAfterTimeoutExpired(
    socket: SkyjoSocket,
    game: Skyjo,
  ) {
    if (!game.haveAtLeastMinPlayersConnected()) {
      game.status = CoreConstants.GAME_STATUS.STOPPED

      const removeGame = this.removeGame(game.code)
      const broadcast = this.broadcastGame(socket, game)

      await Promise.all([removeGame, broadcast])
      return
    }

    if (game.getCurrentPlayer()?.id === socket.data.playerId) {
      game.nextTurn()
    }

    if (
      game.roundStatus ===
      CoreConstants.ROUND_STATUS.WAITING_PLAYERS_TO_TURN_INITIAL_CARDS
    )
      game.checkAllPlayersRevealedCards(game.settings.initialTurnedCount)

    game.checkEndOfRound()
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

  private async reconnectPlayer(
    socket: SkyjoSocket,
    gameCode: string,
    playerId: string,
  ) {
    const game = await this.getGame(gameCode)

    const player = game.getPlayerById(playerId)

    if (!game || !player)
      throw new CError(
        `Game or player not found in game when trying to reconnect. This error can only happen if socket.data is wrong in onRecover method.`,
        {
          code: ErrorConstants.ERROR.PLAYER_NOT_FOUND,
          level: "critical",
          meta: {
            game,
            socket,
            gameCode,
            playerId,
          },
        },
      )

    if (player.disconnectionTimeout) clearTimeout(player.disconnectionTimeout)
    player.socketId = socket.id
    player.connectionStatus = CoreConstants.CONNECTION_STATUS.CONNECTED

    const updatePlayer = BaseService.playerDb.reconnectPlayer(player)
    const joinGame = this.joinGame(socket, game, player, true)

    await Promise.all([updatePlayer, joinGame])
  }
  //#endregion
}
