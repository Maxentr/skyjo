import type { SkyjoOperation } from "@/types/operation.js"
import type {
  PlayPickCard,
  PlayReplaceCard,
  PlayRevealCard,
  PlayTurnCard,
  SkyjoToJson,
} from "@skyjo/core"

export interface ClientToServerGameEvents {
  get: (stateVersion: number | null) => void
  "play:reveal-card": (data: PlayRevealCard, stateVersion: number) => void
  "play:pick-card": (data: PlayPickCard, stateVersion: number) => void
  "play:replace-card": (data: PlayReplaceCard, stateVersion: number) => void
  "play:discard-selected-card": (stateVersion: number) => void
  "play:turn-card": (data: PlayTurnCard, stateVersion: number) => void
  replay: (stateVersion: number) => void
}

export interface ServerToClientGameEvents {
  game: (game: SkyjoToJson) => void
  "game:update": (operations: SkyjoOperation) => void
}
