import { LobbyService } from "@/socketio/services/lobby.service.js"
import { consumeSocketRateLimiter } from "@/socketio/utils/rate-limiter.js"
import { socketErrorWrapper } from "@/socketio/utils/socketErrorWrapper.js"
import {
  type CreatePlayer,
  type JoinGame,
  createPlayer,
  joinGame,
} from "@skyjo/core"
import { CError, Constants as ErrorConstants } from "@skyjo/error"
import type { ErrorJoinMessage } from "@skyjo/shared/types"
import {
  type UpdateGameSettings,
  updateGameSettingsSchema,
} from "@skyjo/shared/validations"
import { RateLimiterMemory } from "rate-limiter-flexible"
import type { SkyjoSocket } from "../types/skyjoSocket.js"

const instance = new LobbyService()

const settingsRateLimiter = new RateLimiterMemory({
  keyPrefix: "settings",
  points: 10,
  duration: 5,
})

const lobbyRouter = (socket: SkyjoSocket) => {
  socket.on(
    "create",
    socketErrorWrapper(async (player: CreatePlayer, isPrivate: boolean) => {
      const parsedPlayer = createPlayer.parse(player)
      await instance.onCreate(socket, parsedPlayer, isPrivate)
    }),
  )

  socket.on(
    "join",
    socketErrorWrapper(async (data: JoinGame) => {
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

  //#region update settings
  socket.on(
    "game:reset-settings",
    socketErrorWrapper(async () => {
      await consumeSocketRateLimiter(settingsRateLimiter)(socket)

      await instance.onResetSettings(socket)
    }),
  )
  socket.on(
    "game:settings",
    socketErrorWrapper(async (data: UpdateGameSettings) => {
      await consumeSocketRateLimiter(settingsRateLimiter)(socket)

      const settings = updateGameSettingsSchema.parse(data)
      await instance.onUpdateSettings(socket, settings)
    }),
  )
  socket.on(
    "game:settings:toggle-validation",
    socketErrorWrapper(async () => {
      await instance.onToggleSettingsValidation(socket)
    }),
  )
  //#endregion

  socket.on(
    "start",
    socketErrorWrapper(async () => {
      await instance.onGameStart(socket)
    }),
  )
}

export { lobbyRouter }
