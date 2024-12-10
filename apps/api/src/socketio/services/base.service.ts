import { Constants } from "@/constants.js"
import { GameStateManager } from "@/socketio/utils/GameStateManager.js"
import { GameRepository } from "@skyjo/cache"
import {
  Constants as CoreConstants,
  type Skyjo,
  type SkyjoPlayer,
} from "@skyjo/core"
import type {
  ServerChatMessage,
  ServerToClientEvents,
} from "@skyjo/shared/types"
import type { SkyjoSocket } from "../types/skyjoSocket.js"

export abstract class BaseService {
  protected redis = new GameRepository()

  protected sendToSocket<T extends keyof ServerToClientEvents>(
    socket: SkyjoSocket,
    params: {
      event: T
      data: Parameters<ServerToClientEvents[T]>
    },
  ) {
    socket.emit(params.event, ...params.data)
  }

  protected sendToRoom<T extends keyof ServerToClientEvents>(
    socket: SkyjoSocket,
    params: {
      room: string
      event: T
      data: Parameters<ServerToClientEvents[T]>
    },
  ) {
    socket.to(params.room).emit(params.event, ...params.data)
  }

  protected sendToSocketAndRoom<T extends keyof ServerToClientEvents>(
    socket: SkyjoSocket,
    params: {
      room: string
      event: T
      data: Parameters<ServerToClientEvents[T]>
    },
  ) {
    this.sendToSocket(socket, params)
    this.sendToRoom(socket, params)
  }

  protected async sendGameToSocket(socket: SkyjoSocket, game: Skyjo) {
    this.sendToSocket(socket, { event: "game", data: [game.toJson()] })
  }

  protected sendGameUpdateToRoom(
    socket: SkyjoSocket,
    params: {
      room: string
      stateManager: GameStateManager
    },
  ) {
    const operations = params.stateManager.getChanges()
    if (!operations) return

    this.sendToRoom(socket, {
      room: params.room,
      event: "game:update",
      data: [operations],
    })
  }

  protected sendGameUpdateToSocketAndRoom(
    socket: SkyjoSocket,
    params: {
      room: string
      stateManager: GameStateManager
    },
  ) {
    const operations = params.stateManager.getChanges()
    if (!operations) return

    this.sendToSocketAndRoom(socket, {
      room: params.room,
      event: "game:update",
      data: [operations],
    })
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

    this.sendToSocket(socket, {
      event: "game:join",
      data: [game.code, game.status, player.id],
    })

    const messageType = reconnection
      ? CoreConstants.SERVER_MESSAGE_TYPE.PLAYER_RECONNECT
      : CoreConstants.SERVER_MESSAGE_TYPE.PLAYER_JOINED
    const message: ServerChatMessage = {
      id: crypto.randomUUID(),
      username: player.name,
      message: messageType,
      type: messageType,
    }

    this.sendToSocketAndRoom(socket, {
      room: game.code,
      event: "message:server",
      data: [message],
    })

    await this.redis.updateGame(game)
  }

  protected async changeAdmin(game: Skyjo) {
    const players = game.getConnectedPlayers([game.adminId])
    if (players.length === 0) return

    const player = players[0]

    game.adminId = player.id

    await this.redis.updateGame(game)
  }

  protected async finishTurn(socket: SkyjoSocket, game: Skyjo) {
    game.nextTurn()

    if (
      game.roundStatus === CoreConstants.ROUND_STATUS.OVER &&
      game.status !== CoreConstants.GAME_STATUS.FINISHED
    ) {
      this.restartRound(socket, game)
    }

    await this.redis.updateGame(game)
  }

  protected async restartRound(socket: SkyjoSocket, game: Skyjo) {
    setTimeout(async () => {
      const stateManager = new GameStateManager(game)
      game.startNewRound()

      this.sendGameUpdateToSocketAndRoom(socket, {
        room: game.code,
        stateManager,
      })
      await this.redis.updateGame(game)
    }, Constants.NEW_ROUND_DELAY)
  }
}
