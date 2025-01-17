import type { FirstPlayerPenaltyType } from "@/constants.js"

export type SkyjoSettingsToJson = {
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
  firstPlayerFlatPenalty: number
  firstPlayerPenaltyType: FirstPlayerPenaltyType
}
