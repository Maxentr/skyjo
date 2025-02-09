import type { SkyjoSocket } from "@/socketio/types/skyjoSocket.js"
import { GameStateManager } from "@/socketio/utils/GameStateManager.js"
import { socketErrorWrapper } from "@/socketio/utils/socketErrorWrapper.js"
import {
  Constants as CoreConstants,
  type ServerMessageType,
  type SkyjoPlayer,
} from "@skyjo/core"
import { CError, Constants as ErrorConstants } from "@skyjo/error"
import { Constants as SharedConstants } from "@skyjo/shared/constants"
import type { LastGame } from "@skyjo/shared/validations"
import { BaseService } from "./base.service.js"

export class PlayerService extends BaseService {
  private disconnectTimeouts: Record<string, NodeJS.Timeout> = {}

  async onConnectionLost(socket: SkyjoSocket) {
    const game = await this.redis.getGame(socket.data.gameCode)
    const player = game.getPlayerById(socket.data.playerId)
    if (!player) {
      throw new CError(`A player lost connection but is not in the game.`, {
        code: ErrorConstants.ERROR.PLAYER_NOT_FOUND,
        level: "error",
        meta: {
          game,
          socket,
          gameCode: game.code,
          playerId: socket.data.playerId,
        },
      })
    }

    const stateManager = new GameStateManager(game)

    player.connectionStatus = CoreConstants.CONNECTION_STATUS.LOST

    await this.updateAndSendGameToRoom(socket, {
      game,
      stateManager,
    })
  }

  async onLeave(socket: SkyjoSocket) {
    try {
      const game = await this.redis.getGame(socket.data.gameCode)
      const stateManager = new GameStateManager(game)

      const player = game.getPlayerById(socket.data.playerId)
      if (!player) {
        throw new CError(
          `Player try to leave a game but he has not been found in it.`,
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

      player.connectionStatus = CoreConstants.CONNECTION_STATUS.LEAVE

      if (game.isAdmin(player.id)) game.changeAdmin()

      if (game.isPlaying()) {
        this.startDisconnectionTimeout(player, () =>
          this.updateGameAfterTimeoutExpired(socket),
        )
      } else {
        game.removePlayer(player.id)

        game.restartGameIfAllPlayersWantReplay()

        this.updateAndSendGame(socket, {
          game,
          stateManager,
        })

        if (game.getConnectedPlayers().length === 0) {
          this.removeGame(game)
        }
      }

      let message: ServerMessageType

      if (game.isPlaying()) {
        message = CoreConstants.SERVER_MESSAGE_TYPE.PLAYER_LEFT_CAN_RECONNECT
      } else {
        message = CoreConstants.SERVER_MESSAGE_TYPE.PLAYER_LEFT
      }

      this.sendToRoom(socket, {
        room: game.code,
        event: "message:server",
        data: [
          {
            id: crypto.randomUUID(),
            username: player.name,
            message,
            type: message,
          },
        ],
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
    const canReconnect = await this.redis.canReconnectPlayer(
      reconnectData.gameCode,
      reconnectData.playerId,
    )
    if (!canReconnect) {
      throw new CError(
        `Player try to reconnect but he does not valid the reconnection conditions.`,
        {
          code: ErrorConstants.ERROR.CANNOT_RECONNECT,
          level: "warn",
          meta: {
            socket,
            gameCode: reconnectData.gameCode,
            playerId: reconnectData.playerId,
          },
        },
      )
    }

    await this.redis.updatePlayerSocketId(
      reconnectData.gameCode,
      reconnectData.playerId,
      socket.id,
    )

    const game = await this.redis.getGame(reconnectData.gameCode)

    const player = game.getPlayerById(reconnectData.playerId)!

    clearTimeout(this.disconnectTimeouts[player.id])
    delete this.disconnectTimeouts[player.id]

    const stateManager = new GameStateManager(game)

    player.socketId = socket.id
    player.connectionStatus = CoreConstants.CONNECTION_STATUS.CONNECTED

    await this.updateAndSendGameToRoom(socket, {
      game,
      stateManager,
    })

    await this.joinGame(socket, game, player, true)
  }

  async onRecover(socket: SkyjoSocket) {
    const game = await this.redis.getGame(socket.data.gameCode)
    const player = game.getPlayerById(socket.data.playerId)
    if (!player) {
      throw new CError(`Player recover connection but is not in the game.`, {
        code: ErrorConstants.ERROR.PLAYER_NOT_FOUND,
        level: "error",
        meta: {
          game,
          socket,
          gameCode: game.code,
          playerId: socket.data.playerId,
        },
      })
    }

    const stateManager = new GameStateManager(game)

    player.connectionStatus = CoreConstants.CONNECTION_STATUS.CONNECTED

    await this.updateAndSendGameToRoom(socket, {
      game,
      stateManager,
    })
  }

  //#region private methods
  private startDisconnectionTimeout(
    player: SkyjoPlayer,
    callback: (...args: unknown[]) => Promise<void>,
  ) {
    player.connectionStatus = CoreConstants.CONNECTION_STATUS.LEAVE

    this.disconnectTimeouts[player.id] = setTimeout(
      socketErrorWrapper(async () => {
        await callback()
      }),
      SharedConstants.LEAVE_TIMEOUT_IN_MS,
    )
  }

  private async updateGameAfterTimeoutExpired(socket: SkyjoSocket) {
    const game = await this.redis.getGame(socket.data.gameCode)
    const player = game.getPlayerById(socket.data.playerId)!

    await this.handlePlayerDisconnection(socket, game, player)

    const message =
      CoreConstants.SERVER_MESSAGE_TYPE.PLAYER_RECONNECTION_EXPIRED
    this.sendToRoom(socket, {
      room: game.code,
      event: "message:server",
      data: [
        {
          id: crypto.randomUUID(),
          username: player.name,
          message,
          type: message,
        },
      ],
    })
  }
  //#endregion
}
