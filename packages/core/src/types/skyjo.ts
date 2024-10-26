import type {
  GameStatus,
  LastTurnStatus,
  RoundStatus,
  TurnStatus,
} from "@/constants.js"
import type { SkyjoPlayerToJson } from "./skyjoPlayer.js"
import type { SkyjoSettingsToJson } from "./skyjoSettings.js"

export interface SkyjoPopulate {
  id: string
  code: string
  status: GameStatus
  turn: number
  discardPile: number[]
  drawPile: number[]

  selectedCardValue: number | null
  turnStatus: TurnStatus
  lastTurnStatus: LastTurnStatus
  roundStatus: RoundStatus

  roundNumber: number

  firstToFinishPlayerId: string | null

  private: boolean
  maxPlayers: number
  allowSkyjoForColumn: boolean
  allowSkyjoForRow: boolean
  initialTurnedCount: number
  cardPerRow: number
  cardPerColumn: number
  scoreToEndGame: number
  multiplierForFirstPlayer: number

  createdAt: Date
  updatedAt: Date

  // Allow any additional fields, they will be ignored
  [key: string]: unknown
}

export interface SkyjoToJson {
  code: string
  status: GameStatus
  adminId: string
  players: SkyjoPlayerToJson[]
  turn: number
  settings: SkyjoSettingsToJson
  selectedCardValue: number | null
  roundStatus: RoundStatus
  turnStatus: TurnStatus
  lastDiscardCardValue?: number
  lastTurnStatus: LastTurnStatus
  updatedAt: Date
}
