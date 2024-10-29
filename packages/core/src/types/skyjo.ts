import type {
  GameStatus,
  LastTurnStatus,
  RoundStatus,
  TurnStatus,
} from "@/constants.js"
import type { SkyjoPlayerScores, SkyjoPlayerToJson } from "./skyjoPlayer.js"
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

export type SkyjoToDb = {
  id: string
  code: string
  adminId: string
  isFull: boolean
  status: string
  players: {
    id: string
    name: string
    socketId: string
    avatar: string
    score: number
    wantsReplay: boolean
    connectionStatus: string
    scores: SkyjoPlayerScores
    hasPlayedLastTurn: boolean
    cards: Array<
      Array<{
        id: string
        value: number
        isVisible: boolean
      }>
    >
  }[]
  turn: number
  discardPile: number[]
  drawPile: number[]
  settings: {
    private: boolean
    maxPlayers: number
    allowSkyjoForColumn: boolean
    allowSkyjoForRow: boolean
    initialTurnedCount: number
    cardPerRow: number
    cardPerColumn: number
    scoreToEndGame: number
    multiplierForFirstPlayer: number
  }
  selectedCardValue: number | null
  roundNumber: number
  roundStatus: string
  turnStatus: string
  lastTurnStatus: string | null
  firstToFinishPlayerId: string | null
  createdAt: Date
  updatedAt: Date
}
