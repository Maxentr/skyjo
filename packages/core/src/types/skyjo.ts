import type {
  Avatar,
  ConnectionStatus,
  FirstPlayerPenaltyType,
  GameStatus,
  LastTurnStatus,
  RoundStatus,
  TurnStatus,
} from "@/constants.js"
import type { SkyjoPlayerScores, SkyjoPlayerToJson } from "./skyjoPlayer.js"
import type { SkyjoSettingsToJson } from "./skyjoSettings.js"

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
  stateVersion: number
  updatedAt: Date
}

export type SkyjoToDb = {
  id: string
  code: string
  adminId: string
  isFull: boolean
  status: GameStatus
  players: {
    id: string
    name: string
    socketId: string
    avatar: Avatar
    score: number
    wantsReplay: boolean
    connectionStatus: ConnectionStatus
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
    isConfirmed: boolean
    private: boolean
    maxPlayers: number
    allowSkyjoForColumn: boolean
    allowSkyjoForRow: boolean
    initialTurnedCount: number
    cardPerRow: number
    cardPerColumn: number
    scoreToEndGame: number
    firstPlayerMultiplierPenalty: number
    firstPlayerPenaltyType: FirstPlayerPenaltyType
    firstPlayerFlatPenalty: number
  }
  selectedCardValue: number | null
  roundNumber: number
  roundStatus: RoundStatus
  turnStatus: TurnStatus
  lastTurnStatus: LastTurnStatus
  firstToFinishPlayerId: string | null
  stateVersion: number
  createdAt: Date
  updatedAt: Date
}
