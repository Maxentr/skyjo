import type { SkyjoOperation } from "@/types/operation.js"
import type {
  PlayPickCard,
  PlayReplaceCard,
  PlayRevealCard,
  PlayTurnCard,
  SkyjoToJson,
} from "@skyjo/core"

export interface ClientToServerGameEvents {
  get: () => void
  "play:reveal-card": (data: PlayRevealCard) => void
  "play:pick-card": (data: PlayPickCard) => void
  "play:replace-card": (data: PlayReplaceCard) => void
  "play:discard-selected-card": () => void
  "play:turn-card": (data: PlayTurnCard) => void
  replay: () => void
}

export interface ServerToClientGameEvents {
  game: (game: SkyjoToJson) => void
  "game:update": (operations: SkyjoOperation) => void
}
