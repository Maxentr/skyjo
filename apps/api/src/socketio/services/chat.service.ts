import { BaseService } from "@/socketio/services/base.service.js"
import type { SkyjoSocket } from "@/socketio/types/skyjoSocket.js"
import { Constants as CoreConstants } from "@skyjo/core"
import { CError, Constants as ErrorConstants } from "@skyjo/error"
import type { UserChatMessage } from "@skyjo/shared/types"

export class ChatService extends BaseService {
  async onMessage(
    socket: SkyjoSocket,
    { username, message }: Omit<UserChatMessage, "id" | "type">,
  ) {
    const game = await this.redis.getGame(socket.data.gameCode)

    if (!game.getPlayerById(socket.data.playerId)) {
      throw new CError(`Player try to send a message but is not found.`, {
        code: ErrorConstants.ERROR.PLAYER_NOT_FOUND,
        meta: {
          game,
          socket,
          gameCode: game.code,
          playerId: socket.data.playerId,
        },
      })
    }

    game.updatedAt = new Date()

    const newMessage: UserChatMessage = {
      id: crypto.randomUUID(),
      username,
      message,
      type: CoreConstants.USER_MESSAGE_TYPE,
    }

    socket.to(game.code).emit("message", newMessage)
    socket.emit("message", newMessage)
  }
}
