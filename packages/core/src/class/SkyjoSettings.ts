import type { SkyjoToDb } from "@/types/skyjo.js"
import type { SkyjoSettingsToJson } from "@/types/skyjoSettings.js"
import { Constants } from "../constants.js"

type UpdateSettings = {
  allowSkyjoForColumn: boolean
  allowSkyjoForRow: boolean
  initialTurnedCount: number
  cardPerRow: number
  cardPerColumn: number
  scoreToEndGame: number
  multiplierForFirstPlayer: number
}

export interface SkyjoSettingsInterface {
  private: boolean
  maxPlayers: number
  allowSkyjoForColumn: boolean
  allowSkyjoForRow: boolean
  initialTurnedCount: number
  cardPerRow: number
  cardPerColumn: number

  updateSettings(settings: UpdateSettings): void
  preventInvalidSettings(): void
  toJson(): SkyjoSettingsToJson
}

export class SkyjoSettings implements SkyjoSettingsInterface {
  isConfirmed: boolean = false
  private: boolean = false
  maxPlayers: number = Constants.SKYJO_DEFAULT_SETTINGS.MAX_PLAYERS
  allowSkyjoForColumn: boolean =
    Constants.SKYJO_DEFAULT_SETTINGS.ALLOW_SKYJO_FOR_COLUMN
  allowSkyjoForRow: boolean =
    Constants.SKYJO_DEFAULT_SETTINGS.ALLOW_SKYJO_FOR_ROW
  initialTurnedCount: number =
    Constants.SKYJO_DEFAULT_SETTINGS.CARDS.INITIAL_TURNED_COUNT
  cardPerRow: number = Constants.SKYJO_DEFAULT_SETTINGS.CARDS.PER_ROW
  cardPerColumn: number = Constants.SKYJO_DEFAULT_SETTINGS.CARDS.PER_COLUMN
  scoreToEndGame: number = Constants.SKYJO_DEFAULT_SETTINGS.SCORE_TO_END_GAME
  multiplierForFirstPlayer: number =
    Constants.SKYJO_DEFAULT_SETTINGS.MULTIPLIER_FOR_FIRST_PLAYER

  constructor(isPrivate: boolean = false) {
    this.private = isPrivate

    if (isPrivate) this.isConfirmed = true
  }

  populate(settings: SkyjoToDb["settings"]) {
    this.isConfirmed = settings.isConfirmed
    this.private = settings.private
    this.maxPlayers = settings.maxPlayers
    this.allowSkyjoForColumn = settings.allowSkyjoForColumn
    this.allowSkyjoForRow = settings.allowSkyjoForRow
    this.initialTurnedCount = settings.initialTurnedCount
    this.cardPerRow = settings.cardPerRow
    this.cardPerColumn = settings.cardPerColumn
    this.scoreToEndGame = settings.scoreToEndGame
    this.multiplierForFirstPlayer = settings.multiplierForFirstPlayer

    return this
  }

  updateSettings(settings: UpdateSettings) {
    this.allowSkyjoForColumn = settings.allowSkyjoForColumn
    this.allowSkyjoForRow = settings.allowSkyjoForRow
    this.initialTurnedCount = settings.initialTurnedCount
    this.cardPerRow = settings.cardPerRow
    this.cardPerColumn = settings.cardPerColumn
    this.scoreToEndGame = settings.scoreToEndGame
    this.multiplierForFirstPlayer = settings.multiplierForFirstPlayer

    this.preventInvalidSettings()
  }

  preventInvalidSettings() {
    if (this.cardPerColumn * this.cardPerRow <= this.initialTurnedCount) {
      this.initialTurnedCount = this.cardPerColumn * this.cardPerRow - 1
    }

    if (this.cardPerColumn === 1 && this.cardPerRow === 1) {
      this.cardPerColumn = 2
    }
  }

  toJson() {
    return {
      isConfirmed: this.isConfirmed,
      private: this.private,
      maxPlayers: this.maxPlayers,
      allowSkyjoForColumn: this.allowSkyjoForColumn,
      allowSkyjoForRow: this.allowSkyjoForRow,
      initialTurnedCount: this.initialTurnedCount,
      cardPerRow: this.cardPerRow,
      cardPerColumn: this.cardPerColumn,
      scoreToEndGame: this.scoreToEndGame,
      multiplierForFirstPlayer: this.multiplierForFirstPlayer,
    } satisfies SkyjoSettingsToJson
  }
}
