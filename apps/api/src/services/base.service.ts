import { Constants } from "@/constants.js"
import { GameStateManager } from "@/utils/GameStateManager.js"
import { GameRepository } from "@skyjo/cache"
import {
  Constants as CoreConstants,
  type Skyjo,
  type SkyjoPlayer,
} from "@skyjo/core"
import type { ServerChatMessage } from "@skyjo/shared/types"
import type { ServerToClientEvents } from "@skyjo/shared/types"
import type { SkyjoSocket } from "../types/skyjoSocket.js"

export abstract class BaseService {
  protected redis = new GameRepository()

  protected sendToSocket<T extends keyof ServerToClientEvents>(
    socket: SkyjoSocket,
    event: T,
    ...data: Parameters<ServerToClientEvents[T]>
  ) {
    socket.emit(event, ...data)
  }

  protected sendToRoom<T extends keyof ServerToClientEvents>(
    socket: SkyjoSocket,
    event: T,
    ...data: Parameters<ServerToClientEvents[T]>
  ) {
    socket.to(socket.data.gameCode).emit(event, ...data)
  }

  protected sendToSocketAndRoom<T extends keyof ServerToClientEvents>(
    socket: SkyjoSocket,
    event: T,
    ...data: Parameters<ServerToClientEvents[T]>
  ) {
    this.sendToSocket(socket, event, ...data)
    this.sendToRoom(socket, event, ...data)
  }

  protected async sendGameToSocket(socket: SkyjoSocket, game: Skyjo) {
    this.sendToSocket(socket, "game", game.toJson())
  }

  protected sendGameUpdateToSocket(
    socket: SkyjoSocket,
    stateManager: GameStateManager,
  ) {
    const operations = stateManager.getChanges()

    this.sendToSocket(socket, "game:update", operations)
  }

  protected sendGameUpdateToRoom(
    socket: SkyjoSocket,
    stateManager: GameStateManager,
  ) {
    const operations = stateManager.getChanges()

    this.sendToRoom(socket, "game:update", operations)
  }

  protected sendGameUpdateToSocketAndRoom(
    socket: SkyjoSocket,
    stateManager: GameStateManager,
  ) {
    const operations = stateManager.getChanges()

    this.sendToSocketAndRoom(socket, "game:update", operations)
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

    this.sendToSocket(socket, "game:join", game.code, game.status, player.id)

    const messageType = reconnection
      ? CoreConstants.SERVER_MESSAGE_TYPE.PLAYER_RECONNECT
      : CoreConstants.SERVER_MESSAGE_TYPE.PLAYER_JOINED
    const message: ServerChatMessage = {
      id: crypto.randomUUID(),
      username: player.name,
      message: messageType,
      type: messageType,
    }

    this.sendToSocketAndRoom(socket, "message:server", message)

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
  }

  protected async restartRound(socket: SkyjoSocket, game: Skyjo) {
    setTimeout(() => {
      const stateManager = new GameStateManager(game)
      game.startNewRound()
      this.sendGameUpdateToSocketAndRoom(socket, stateManager)
    }, Constants.NEW_ROUND_DELAY)
  }
}
