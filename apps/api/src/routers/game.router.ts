import { GameService } from "@/services/game.service.js"
import { socketErrorHandlerWrapper } from "@/utils/socketErrorHandlerWrapper.js"
import {
  type PlayPickCard,
  type PlayReplaceCard,
  type PlayRevealCard,
  type PlayTurnCard,
  playPickCard,
  playReplaceCard,
  playRevealCard,
  playTurnCard,
} from "@skyjo/core"
import type { SkyjoSocket } from "../types/skyjoSocket.js"

const instance = new GameService()

const gameRouter = (socket: SkyjoSocket) => {
  socket.on(
    "get",
    socketErrorHandlerWrapper(async () => {
      await instance.onGet(socket)
    }),
  )

  socket.on(
    "play:reveal-card",
    socketErrorHandlerWrapper(async (data: PlayRevealCard) => {
      const turnCardData = playRevealCard.parse(data)
      await instance.onRevealCard(socket, turnCardData)
    }),
  )

  socket.on(
    "play:pick-card",
    socketErrorHandlerWrapper(async (data: PlayPickCard) => {
      const playData = playPickCard.parse(data)
      await instance.onPickCard(socket, playData)
    }),
  )

  socket.on(
    "play:replace-card",
    socketErrorHandlerWrapper(async (data: PlayReplaceCard) => {
      const playData = playReplaceCard.parse(data)
      await instance.onReplaceCard(socket, playData)
    }),
  )

  socket.on(
    "play:discard-selected-card",
    socketErrorHandlerWrapper(async () => {
      await instance.onDiscardCard(socket)
    }),
  )

  socket.on(
    "play:turn-card",
    socketErrorHandlerWrapper(async (data: PlayTurnCard) => {
      const playData = playTurnCard.parse(data)
      await instance.onTurnCard(socket, playData)
    }),
  )

  socket.on(
    "replay",
    socketErrorHandlerWrapper(async () => {
      await instance.onReplay(socket)
    }),
  )
}

export { gameRouter }
