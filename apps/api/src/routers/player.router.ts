import { PlayerService } from "@/services/player.service.js"
import { socketErrorHandlerWrapper } from "@/utils/socketErrorHandlerWrapper.js"
import { CError, Constants as ErrorConstants } from "@skyjo/error"
import { Logger } from "@skyjo/logger"
import type { ErrorReconnectMessage } from "@skyjo/shared/types/events/player"
import { type LastGame, reconnect } from "@skyjo/shared/validations/reconnect"
import type { DisconnectReason } from "socket.io"
import type { SkyjoSocket } from "../types/skyjoSocket.js"

const instance = new PlayerService()

const playerRouter = (socket: SkyjoSocket) => {
  if (socket.recovered) {
    socketErrorHandlerWrapper(async () => {
      await instance.onRecover(socket)
    })
  }

  socket.on(
    "leave",
    socketErrorHandlerWrapper(async () => {
      await instance.onLeave(socket)
      socket.emit("leave:success")
    }),
  )

  socket.on(
    "disconnect",
    socketErrorHandlerWrapper(async (reason: DisconnectReason) => {
      Logger.info(`Socket ${socket.id} disconnected for reason ${reason}`)
      if (reason === "ping timeout") await instance.onLeave(socket, true)
      else await instance.onLeave(socket)
    }),
  )

  socket.on(
    "reconnect",
    socketErrorHandlerWrapper(async (reconnectData: LastGame) => {
      try {
        reconnect.parse(reconnectData)
        await instance.onReconnect(socket, reconnectData)
      } catch (error) {
        if (
          error instanceof CError &&
          error.code === ErrorConstants.ERROR.CANNOT_RECONNECT
        ) {
          socket.emit(
            "error:reconnect",
            error.code satisfies ErrorReconnectMessage,
          )
        } else {
          throw error
        }
      }
    }),
  )
}

export { playerRouter }
