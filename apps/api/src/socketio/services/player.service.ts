import type { SkyjoSocket } from "@/socketio/types/skyjoSocket.js"
import { GameStateManager } from "@/socketio/utils/GameStateManager.js"
import { socketErrorWrapper } from "@/socketio/utils/socketErrorWrapper.js"
import {
  Constants as CoreConstants,
  type ServerMessageType,
  Skyjo,
  type SkyjoPlayer,
} from "@skyjo/core"
import { CError, Constants as ErrorConstants } from "@skyjo/error"
import { Constants as SharedConstants } from "@skyjo/shared/constants"
import type { LastGame } from "@skyjo/shared/validations"
import { BaseService } from "./base.service.js"

export class PlayerService extends BaseService {
  private disconnectTimeouts: Record<string, NodeJS.Timeout> = {}

  async onLeave(socket: SkyjoSocket, timeout: boolean = false) {
    try {
      const game = await this.redis.getGame(socket.data.gameCode)
      const stateManager = new GameStateManager(game)

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

      await this.redis.updateGame(game)

      if (game.isAdmin(player.id)) await this.changeAdmin(game)

      if (
        game.status === CoreConstants.GAME_STATUS.LOBBY ||
        game.status === CoreConstants.GAME_STATUS.STOPPED ||
        game.status === CoreConstants.GAME_STATUS.FINISHED
      )
        game.removePlayer(player.id)

      if (game.status !== CoreConstants.GAME_STATUS.PLAYING) {
        game.restartGameIfAllPlayersWantReplay()

        const promises: Promise<void>[] = []

        if (game.getConnectedPlayers().length === 0) {
          await this.redis.removeGame(game.code)
        } else {
          const updateGame = this.redis.updateGame(game)
          promises.push(updateGame)
        }

        this.sendGameUpdateToSocketAndRoom(socket, {
          room: game.code,
          stateManager,
        })
        await Promise.all(promises)
      } else {
        this.startDisconnectionTimeout(player, timeout, () =>
          this.updateGameAfterTimeoutExpired(socket),
        )
      }

      this.sendLeaveMessageToRoom(socket, game, player, timeout)

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

    await this.redis.updatePlayerSocketId(
      reconnectData.gameCode,
      reconnectData.playerId,
      socket.id,
    )

    await this.reconnectPlayer(
      socket,
      reconnectData.gameCode,
      reconnectData.playerId,
    )
  }

  async onRecover(socket: SkyjoSocket) {
    try {
      await this.reconnectPlayer(
        socket,
        socket.data.gameCode,
        socket.data.playerId,
      )
    } catch (error) {
      if (
        error instanceof CError &&
        error.code === ErrorConstants.ERROR.GAME_NOT_FOUND
      )
        socket.emit("error:recover", error.code)
      else {
        throw error
      }
    }
  }

  //#region private methods
  private sendLeaveMessageToRoom(
    socket: SkyjoSocket,
    game: Skyjo,
    player: SkyjoPlayer,
    timeout: boolean,
  ) {
    let message: ServerMessageType

    if (game.status === CoreConstants.GAME_STATUS.PLAYING) {
      message = timeout
        ? CoreConstants.SERVER_MESSAGE_TYPE.PLAYER_TIMEOUT_CAN_RECONNECT
        : CoreConstants.SERVER_MESSAGE_TYPE.PLAYER_LEFT_CAN_RECONNECT
    } else {
      message = timeout
        ? CoreConstants.SERVER_MESSAGE_TYPE.PLAYER_TIMEOUT
        : CoreConstants.SERVER_MESSAGE_TYPE.PLAYER_LEFT
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
  }
  private startDisconnectionTimeout(
    player: SkyjoPlayer,
    connectionLost: boolean,
    callback: (...args: unknown[]) => Promise<void>,
  ) {
    player.connectionStatus = connectionLost
      ? CoreConstants.CONNECTION_STATUS.CONNECTION_LOST
      : CoreConstants.CONNECTION_STATUS.LEAVE

    this.disconnectTimeouts[player.id] = setTimeout(
      socketErrorWrapper(async () => {
        await callback()
      }),
      connectionLost
        ? SharedConstants.CONNECTION_LOST_TIMEOUT_IN_MS
        : SharedConstants.LEAVE_TIMEOUT_IN_MS,
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

  private async reconnectPlayer(
    socket: SkyjoSocket,
    gameCode: string,
    playerId: string,
  ) {
    const game = await this.redis.getGame(gameCode)

    const player = game.getPlayerById(playerId)

    if (!game || !player) {
      const errorCode = !player
        ? ErrorConstants.ERROR.PLAYER_NOT_FOUND
        : ErrorConstants.ERROR.GAME_NOT_FOUND

      throw new CError(
        `Game or player not found in game when trying to reconnect. This error can happen if the user reconnect but the game has been deleted or the player has been removed from the game.`,
        {
          code: errorCode,
          level: "warn",
          meta: {
            game,
            socket,
            gameCode,
            playerId,
          },
        },
      )
    }

    clearTimeout(this.disconnectTimeouts[player.id])
    delete this.disconnectTimeouts[player.id]

    const stateManager = new GameStateManager(game)

    player.socketId = socket.id
    player.connectionStatus = CoreConstants.CONNECTION_STATUS.CONNECTED

    this.sendGameUpdateToRoom(socket, {
      room: game.code,
      stateManager,
    })

    await this.redis.updateGame(game)
    await this.joinGame(socket, game, player, true)
  }
  //#endregion
}
