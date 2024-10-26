import { z } from "zod"
import { createPlayer } from "./player.js"

export const joinGame = z.object({
  gameCode: z.string(),
  player: createPlayer,
})

export type JoinGame = z.infer<typeof joinGame>
