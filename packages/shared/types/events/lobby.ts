import type { CreatePlayer, GameStatus, JoinGame } from "@skyjo/core"
import type { Error as ThrownError } from "@skyjo/error"

export interface ClientToServerLobbyEvents {
  "create-private": (player: CreatePlayer) => void
  find: (player: CreatePlayer) => void
  join: (data: JoinGame) => void
  start: () => void
}

export type ErrorJoinMessage = Extract<
  ThrownError,
  "game-not-found" | "game-already-started" | "game-is-full"
>

export interface ServerToClientLobbyEvents {
  "error:join": (message: ErrorJoinMessage) => void
  "game:join": (code: string, status: GameStatus, playerId: string) => void
}
