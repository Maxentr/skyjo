import { LobbyService } from "@/socketio/services/lobby.service.js"
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
  type UpdateGameSettingsAllowSkyjoForColumn,
  type UpdateGameSettingsAllowSkyjoForRow,
  type UpdateGameSettingsCardPerColumn,
  type UpdateGameSettingsCardPerRow,
  type UpdateGameSettingsInitialTurnedCount,
  type UpdateGameSettingsMultiplierForFirstPlayer,
  type UpdateGameSettingsScoreToEndGame,
  updateGameSettingsAllowSkyjoForColumnSchema,
  updateGameSettingsAllowSkyjoForRowSchema,
  updateGameSettingsCardPerColumnSchema,
  updateGameSettingsCardPerRowSchema,
  updateGameSettingsInitialTurnedCountSchema,
  updateGameSettingsMultiplierForFirstPlayerSchema,
  updateGameSettingsSchema,
  updateGameSettingsScoreToEndGameSchema,
} from "@skyjo/shared/validations"
import type { SkyjoSocket } from "../types/skyjoSocket.js"

const instance = new LobbyService()

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
    "game:settings",
    socketErrorWrapper(async (data: UpdateGameSettings) => {
      const settings = updateGameSettingsSchema.parse(data)
      await instance.onUpdateSettings(socket, settings)
    }),
  )
  socket.on(
    "game:settings:allow-skyjo-for-column",
    socketErrorWrapper(async (data: UpdateGameSettingsAllowSkyjoForColumn) => {
      const isAllowed = updateGameSettingsAllowSkyjoForColumnSchema.parse(
        data,
        {
          path: ["allowSkyjoForColumn"],
        },
      )

      await instance.onUpdateSingleSettings(
        socket,
        "allowSkyjoForColumn",
        isAllowed,
      )
    }),
  )
  socket.on(
    "game:settings:allow-skyjo-for-row",
    socketErrorWrapper(async (data: UpdateGameSettingsAllowSkyjoForRow) => {
      const isAllowed = updateGameSettingsAllowSkyjoForRowSchema.parse(data, {
        path: ["allowSkyjoForRow"],
      })
      await instance.onUpdateSingleSettings(
        socket,
        "allowSkyjoForRow",
        isAllowed,
      )
    }),
  )
  socket.on(
    "game:settings:initial-turned-count",
    socketErrorWrapper(async (data: UpdateGameSettingsInitialTurnedCount) => {
      const initialTurnedCount =
        updateGameSettingsInitialTurnedCountSchema.parse(data, {
          path: ["initialTurnedCount"],
        })
      await instance.onUpdateSingleSettings(
        socket,
        "initialTurnedCount",
        initialTurnedCount,
      )
    }),
  )
  socket.on(
    "game:settings:card-per-row",
    socketErrorWrapper(async (data: UpdateGameSettingsCardPerRow) => {
      const cardPerRow = updateGameSettingsCardPerRowSchema.parse(data, {
        path: ["cardPerRow"],
      })
      await instance.onUpdateSingleSettings(socket, "cardPerRow", cardPerRow)
    }),
  )
  socket.on(
    "game:settings:card-per-column",
    socketErrorWrapper(async (data: UpdateGameSettingsCardPerColumn) => {
      const cardPerColumn = updateGameSettingsCardPerColumnSchema.parse(data, {
        path: ["cardPerColumn"],
      })
      await instance.onUpdateSingleSettings(
        socket,
        "cardPerColumn",
        cardPerColumn,
      )
    }),
  )
  socket.on(
    "game:settings:score-to-end-game",
    socketErrorWrapper(async (data: UpdateGameSettingsScoreToEndGame) => {
      const scoreToEndGame = updateGameSettingsScoreToEndGameSchema.parse(
        data,
        {
          path: ["scoreToEndGame"],
        },
      )
      await instance.onUpdateSingleSettings(
        socket,
        "scoreToEndGame",
        scoreToEndGame,
      )
    }),
  )
  socket.on(
    "game:settings:multiplier-for-first-player",
    socketErrorWrapper(
      async (data: UpdateGameSettingsMultiplierForFirstPlayer) => {
        const multiplierForFirstPlayer =
          updateGameSettingsMultiplierForFirstPlayerSchema.parse(data, {
            path: ["multiplierForFirstPlayer"],
          })
        await instance.onUpdateSingleSettings(
          socket,
          "multiplierForFirstPlayer",
          multiplierForFirstPlayer,
        )
      },
    ),
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
