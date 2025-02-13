import { Server as HttpServer } from "http"
import { ENV } from "@env"
import type { ServerType } from "@hono/node-server"
import { Logger } from "@skyjo/logger"
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@skyjo/shared/types"
import { Server } from "socket.io"
import customParser from "socket.io-msgpack-parser"
import { chatRouter } from "./routers/chat.router.js"
import { gameRouter } from "./routers/game.router.js"
import { kickRouter } from "./routers/kick.router.js"
import { lobbyRouter } from "./routers/lobby.router.js"
import { playerRouter } from "./routers/player.router.js"
import type { SkyjoSocket } from "./types/skyjoSocket.js"

export const initializeSocketServer = (server: ServerType) => {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(
    server as HttpServer,
    {
      parser: customParser,
      transports: ["polling", "websocket"],
      cors: {
        origin: ENV.ORIGINS,
      },
      pingInterval: 20000,
      pingTimeout: 40000,
      upgradeTimeout: 20000,
      connectionStateRecovery: {
        maxDisconnectionDuration: 180000,
        skipMiddlewares: true,
      },
    },
  )

  io.engine.on("connection_error", (err) => {
    Logger.error("Socket connection error", err)
  })

  io.on("connection", (socket: SkyjoSocket) => {
    lobbyRouter(socket)
    playerRouter(socket)
    gameRouter(socket)
    chatRouter(socket)
    kickRouter(socket)
  })

  return io
}
