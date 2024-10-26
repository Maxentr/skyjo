import { LobbyService } from "@/services/lobby.service.js"
import { socketErrorHandlerWrapper } from "@/utils/socketErrorHandlerWrapper.js"
import {
  type ChangeSettings,
  type CreatePlayer,
  type JoinGame,
  changeSettings,
  createPlayer,
  joinGame,
} from "@skyjo/core"
import { CError, Constants as ErrorConstants } from "@skyjo/error"
import type { ErrorJoinMessage } from "@skyjo/shared/types/socket"
import type { SkyjoSocket } from "../types/skyjoSocket.js"

const instance = new LobbyService()

const lobbyRouter = (socket: SkyjoSocket) => {
  socket.on(
    "create-private",
    socketErrorHandlerWrapper(async (player: CreatePlayer) => {
      const parsedPlayer = createPlayer.parse(player)
      await instance.onCreate(socket, parsedPlayer)
    }),
  )

  socket.on(
    "find",
    socketErrorHandlerWrapper(async (player: CreatePlayer) => {
      const parsedPlayer = createPlayer.parse(player)
      await instance.onFind(socket, parsedPlayer)
    }),
  )

  socket.on(
    "join",
    socketErrorHandlerWrapper(async (data: JoinGame) => {
      try {
        const { gameCode, player } = joinGame.parse(data)
        await instance.onJoin(socket, gameCode, player)
      } catch (error) {
        if (
          error instanceof CError &&
          (error.code === ErrorConstants.ERROR.GAME_NOT_FOUND ||
            error.code === ErrorConstants.ERROR.GAME_ALREADY_STARTED ||
            error.code === ErrorConstants.ERROR.GAME_IS_FULL)
        ) {
          socket.emit("error:join", error.code satisfies ErrorJoinMessage)
        } else {
          throw error
        }
      }
    }),
  )

  socket.on(
    "settings",
    socketErrorHandlerWrapper(async (data: ChangeSettings) => {
      const newSettings = changeSettings.parse(data)
      await instance.onSettingsChange(socket, newSettings)
    }),
  )

  socket.on(
    "start",
    socketErrorHandlerWrapper(async () => {
      await instance.onGameStart(socket)
    }),
  )
}

export { lobbyRouter }
