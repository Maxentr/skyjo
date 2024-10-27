import type {
  GameStatus,
  LastTurnStatus,
  RoundStatus,
  TurnStatus,
} from "@/constants.js"
import type { SkyjoPlayerToJson } from "./skyjoPlayer.js"
import type { SkyjoSettingsToJson } from "./skyjoSettings.js"

export type SkyjoPopulate = {
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

export type SkyjoToJson = {
  id: string
  code: string
  adminId: string
  isFull: boolean
  status: GameStatus
  players: SkyjoPlayerToJson[]
  turn: number
  discardPile: number[]
  drawPile: number[]
  settings: SkyjoSettingsToJson
  selectedCardValue: number | null
  roundNumber: number
  roundStatus: RoundStatus
  turnStatus: TurnStatus
  lastTurnStatus: LastTurnStatus
  firstToFinishPlayerId: string | null
  createdAt: Date
  updatedAt: Date
}
