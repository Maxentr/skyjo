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

  protected async sendMissingStatesToSocket(
    socket: SkyjoSocket,
    game: Skyjo,
    clientStateVersion: number,
  ) {
    const states = await this.redis.getGameStates(
      game.code,
      clientStateVersion + 1,
      game.stateVersion,
    )
    this.sendToSocket(socket, { event: "game:fix", data: [states] })
  }

  protected async updateAndSendGameToRoom(
    socket: SkyjoSocket,
    params: {
      game: Skyjo
      stateManager: GameStateManager
    },
  ) {
    const operations = params.stateManager.getChanges()
    if (!operations) return

    await this.redis.updateGame(params.game, operations)

    this.sendToRoom(socket, {
      room: params.game.code,
      event: "game:update",
      data: [operations],
    })
  }

  protected async updateAndSendGame(
    socket: SkyjoSocket,
    params: {
      game: Skyjo
      stateManager: GameStateManager
    },
  ) {
    const operations = params.stateManager.getChanges()
    if (!operations) return

    await this.redis.updateGame(params.game, operations)

    this.sendToSocketAndRoom(socket, {
      room: params.game.code,
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

  protected async finishTurn(socket: SkyjoSocket, game: Skyjo) {
    game.nextTurn()

    if (game.shouldRestartRound()) {
      this.restartRound(socket, game)
    }

    await this.redis.updateGame(game)
  }

  protected async restartRound(socket: SkyjoSocket, game: Skyjo) {
    setTimeout(async () => {
      const stateManager = new GameStateManager(game)
      game.startNewRound()

      this.updateAndSendGame(socket, {
        game,
        stateManager,
      })
    }, Constants.NEW_ROUND_DELAY)
  }

  protected async handlePlayerDisconnection(
    socket: SkyjoSocket,
    game: Skyjo,
    player: SkyjoPlayer,
    params: {
      force: boolean
    } = {
      force: false,
    },
  ) {
    const stateManager = new GameStateManager(game)

    const isConnected =
      player &&
      player.connectionStatus === CoreConstants.CONNECTION_STATUS.CONNECTED

    if (isConnected && !params.force) return

    player.connectionStatus = CoreConstants.CONNECTION_STATUS.DISCONNECTED

    if (game.isAdmin(player.id)) game.changeAdmin()

    if (!game.isPlaying()) {
      game.removePlayer(player.id)
      await this.redis.removePlayer(game.code, player.id)

      this.updateAndSendGame(socket, {
        game,
        stateManager,
      })
      return
    }

    if (!game.hasMinPlayersConnected()) {
      game.status = CoreConstants.GAME_STATUS.STOPPED

      this.updateAndSendGame(socket, {
        game,
        stateManager,
      })
      this.removeGame(game)
      return
    }

    if (game.getCurrentPlayer()?.id === player.id) game.nextTurn()

    if (game.isRoundTurningCards() && game.haveAllPlayersRevealedCards()) {
      game.startRoundAfterInitialReveal()
    }

    game.checkEndOfRound()

    if (game.shouldRestartRound()) {
      this.restartRound(socket, game)
    }

    this.updateAndSendGame(socket, {
      game,
      stateManager,
    })
  }

  protected async removeGame(game: Skyjo) {
    this.redis.removeGame(game.code)
  }
}
