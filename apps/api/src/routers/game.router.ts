import { GameService } from "@/services/game.service.js"
import { socketErrorWrapper } from "@/utils/socketErrorWrapper.js"
import {
  type PlayPickCard,
  type PlayReplaceCard,
  type PlayRevealCard,
  type PlayTurnCard,
  playPickCard,
  playReplaceCard,
  playRevealCard,
  playTurnCard,
  stateVersionSchema,
} from "@skyjo/core"
import type { SkyjoSocket } from "../types/skyjoSocket.js"

const instance = new GameService()

const gameRouter = (socket: SkyjoSocket) => {
  socket.on(
    "get",
    socketErrorWrapper(async (clientStateVersion: number) => {
      const stateVersion = stateVersionSchema
        .nullable()
        .parse(clientStateVersion)

      await instance.onGet(socket, stateVersion)
    }),
  )

  socket.on(
    "play:reveal-card",
    socketErrorWrapper(
      async (data: PlayRevealCard, clientStateVersion: number) => {
        const turnCardData = playRevealCard.parse(data)
        const stateVersion = stateVersionSchema.parse(clientStateVersion)

        await instance.onRevealCard(socket, turnCardData, stateVersion)
      },
    ),
  )

  socket.on(
    "play:pick-card",
    socketErrorWrapper(
      async (data: PlayPickCard, clientStateVersion: number) => {
        const playData = playPickCard.parse(data)
        const stateVersion = stateVersionSchema.parse(clientStateVersion)

        await instance.onPickCard(socket, playData, stateVersion)
      },
    ),
  )

  socket.on(
    "play:replace-card",
    socketErrorWrapper(
      async (data: PlayReplaceCard, clientStateVersion: number) => {
        const playData = playReplaceCard.parse(data)
        const stateVersion = stateVersionSchema.parse(clientStateVersion)

        await instance.onReplaceCard(socket, playData, stateVersion)
      },
    ),
  )

  socket.on(
    "play:discard-selected-card",
    socketErrorWrapper(async (clientStateVersion: number) => {
      const stateVersion = stateVersionSchema.parse(clientStateVersion)

      await instance.onDiscardCard(socket, stateVersion)
    }),
  )

  socket.on(
    "play:turn-card",
    socketErrorWrapper(
      async (data: PlayTurnCard, clientStateVersion: number) => {
        const playData = playTurnCard.parse(data)
        const stateVersion = stateVersionSchema.parse(clientStateVersion)

        await instance.onTurnCard(socket, playData, stateVersion)
      },
    ),
  )

  socket.on(
    "replay",
    socketErrorWrapper(async (clientStateVersion: number) => {
      await instance.onReplay(socket, clientStateVersion)
    }),
  )
}

export { gameRouter }
