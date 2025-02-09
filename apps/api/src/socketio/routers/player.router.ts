import { PlayerService } from "@/socketio/services/player.service.js"
import { socketErrorWrapper } from "@/socketio/utils/socketErrorWrapper.js"
import { CError, Constants as ErrorConstants } from "@skyjo/error"
import { Logger } from "@skyjo/logger"
import type { ErrorReconnectMessage } from "@skyjo/shared/types"
import { type LastGame, reconnect } from "@skyjo/shared/validations"
import type { DisconnectReason } from "socket.io"
import type { SkyjoSocket } from "../types/skyjoSocket.js"

const instance = new PlayerService()

const playerRouter = (socket: SkyjoSocket) => {
  if (socket.recovered) {
    socketErrorWrapper(async () => {
      await instance.onRecover(socket)
    })
  }

  socket.on(
    "leave",
    socketErrorWrapper(async () => {
      await instance.onLeave(socket)
      socket.emit("leave:success")
    }),
  )

  socket.on(
    "disconnect",
    socketErrorWrapper(async (reason: DisconnectReason) => {
      Logger.info(`Socket ${socket.id} disconnected for reason ${reason}`)

      if (reason === "ping timeout") await instance.onConnectionLost(socket)
      else await instance.onLeave(socket)
    }),
  )

  socket.on(
    "reconnect",
    socketErrorWrapper(async (reconnectData: LastGame) => {
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

  socket.on(
    "recover",
    socketErrorWrapper(async () => {
      await instance.onRecover(socket)
    }),
  )
}

export { playerRouter }
