export interface SkyjoSettingsToJson {
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
