import { Constants } from "@/constants.js"
import { GameRepository } from "@skyjo/cache"
import {
  Constants as CoreConstants,
  type Skyjo,
  type SkyjoPlayer,
} from "@skyjo/core"
import type { ServerChatMessage } from "@skyjo/shared/types/chat"
import type { ServerToClientEvents } from "@skyjo/shared/types/socket"
import type { SkyjoSocket } from "../types/skyjoSocket.js"

export abstract class BaseService {
  protected redis = new GameRepository()

  protected async sendGame(socket: SkyjoSocket, game: Skyjo) {
    socket.emit("game", game.toJson())
  }

  protected async sendToSocket<T extends keyof ServerToClientEvents>(
    socket: SkyjoSocket,
    event: T,
    ...data: Parameters<ServerToClientEvents[T]>
  ) {
    socket.emit(event, ...data)
  }

  protected async sendToRoom<T extends keyof ServerToClientEvents>(
    socket: SkyjoSocket,
    event: T,
    ...data: Parameters<ServerToClientEvents[T]>
  ) {
    socket.to(socket.data.gameCode).emit(event, ...data)
  }

  protected async sendToSocketAndRoom<T extends keyof ServerToClientEvents>(
    socket: SkyjoSocket,
    event: T,
    ...data: Parameters<ServerToClientEvents[T]>
  ) {
    await this.sendToSocket(socket, event, ...data)
    await this.sendToRoom(socket, event, ...data)
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

    await this.sendToSocket(socket, "game:join", game.toJson(), player.id)

    const messageType = reconnection
      ? CoreConstants.SERVER_MESSAGE_TYPE.PLAYER_RECONNECT
      : CoreConstants.SERVER_MESSAGE_TYPE.PLAYER_JOINED
    const message: ServerChatMessage = {
      id: crypto.randomUUID(),
      username: player.name,
      message: messageType,
      type: messageType,
    }

    await this.sendToSocketAndRoom(socket, "message:server", message)

    const updateGame = this.redis.updateGame(game)
    const sendToRoom = this.sendToRoom(
      socket,
      "game:player:join",
      player.toJson(),
    )

    await Promise.all([updateGame, sendToRoom])
  }

  protected async changeAdmin(socket: SkyjoSocket, game: Skyjo) {
    const players = game.getConnectedPlayers([game.adminId])
    if (players.length === 0) return

    const player = players[0]

    game.adminId = player.id

    await this.redis.updateGame(game)
    await this.sendToSocketAndRoom(socket, "game:admin-id", player.id)
  }

  protected async finishTurn(socket: SkyjoSocket, game: Skyjo) {
    game.nextTurn()

    if (
      game.roundStatus === CoreConstants.ROUND_STATUS.OVER &&
      game.status !== CoreConstants.GAME_STATUS.FINISHED
    ) {
      this.restartRound(socket, game)
    }

    const updateGame = await this.redis.updateGame(game)
    const broadcast = this.broadcastGame(socket, game)

    await Promise.all([updateGame, broadcast])
  }

  protected async restartRound(socket: SkyjoSocket, game: Skyjo) {
    setTimeout(() => {
      game.startNewRound()
      this.broadcastGame(socket, game)
    }, Constants.NEW_ROUND_DELAY)
  }
}
