import type { CreatePlayer, GameStatus, JoinGame } from "@skyjo/core"
import type { Error as ThrownError } from "@skyjo/error"

export interface ClientToServerLobbyEvents {
  create: (player: CreatePlayer, isPrivate: boolean) => void
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
