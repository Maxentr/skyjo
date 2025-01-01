import type { SkyjoToDb } from "@/types/skyjo.js"
import type { SkyjoSettingsToJson } from "@/types/skyjoSettings.js"
import { Constants, type FirstPlayerPenaltyType } from "../constants.js"

type UpdateSettings = {
  maxPlayers?: number
  allowSkyjoForColumn?: boolean
  allowSkyjoForRow?: boolean
  initialTurnedCount?: number
  cardPerRow?: number
  cardPerColumn?: number
  scoreToEndGame?: number
  firstPlayerMultiplierPenalty?: number
  firstPlayerScoreFlatPenalty?: number
  firstPlayerPenaltyType?: FirstPlayerPenaltyType
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
  firstPlayerMultiplierPenalty: number =
    Constants.SKYJO_DEFAULT_SETTINGS.FIRST_PLAYER_MULTIPLIER_PENALTY
  firstPlayerScoreFlatPenalty: number =
    Constants.SKYJO_DEFAULT_SETTINGS.FIRST_PLAYER_SCORE_FLAT_PENALTY
  firstPlayerPenaltyType: FirstPlayerPenaltyType =
    Constants.SKYJO_DEFAULT_SETTINGS.FIRST_PLAYER_PENALTY_TYPE

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
    this.firstPlayerMultiplierPenalty = settings.firstPlayerMultiplierPenalty
    this.firstPlayerScoreFlatPenalty = settings.firstPlayerScoreFlatPenalty
    this.firstPlayerPenaltyType = settings.firstPlayerPenaltyType

    return this
  }

  /* istanbul ignore next --@preserve */
  updateSettings(settings: UpdateSettings) {
    this.maxPlayers = settings.maxPlayers ?? this.maxPlayers
    this.allowSkyjoForColumn =
      settings.allowSkyjoForColumn ?? this.allowSkyjoForColumn
    this.allowSkyjoForRow = settings.allowSkyjoForRow ?? this.allowSkyjoForRow
    this.initialTurnedCount =
      settings.initialTurnedCount ?? this.initialTurnedCount
    this.cardPerRow = settings.cardPerRow ?? this.cardPerRow
    this.cardPerColumn = settings.cardPerColumn ?? this.cardPerColumn
    this.scoreToEndGame = settings.scoreToEndGame ?? this.scoreToEndGame
    this.firstPlayerMultiplierPenalty =
      settings.firstPlayerMultiplierPenalty ?? this.firstPlayerMultiplierPenalty
    this.firstPlayerScoreFlatPenalty =
      settings.firstPlayerScoreFlatPenalty ?? this.firstPlayerScoreFlatPenalty
    this.firstPlayerPenaltyType =
      settings.firstPlayerPenaltyType ?? this.firstPlayerPenaltyType

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

  isClassicSettings() {
    return (
      this.allowSkyjoForColumn ===
        Constants.SKYJO_DEFAULT_SETTINGS.ALLOW_SKYJO_FOR_COLUMN &&
      this.allowSkyjoForRow ===
        Constants.SKYJO_DEFAULT_SETTINGS.ALLOW_SKYJO_FOR_ROW &&
      this.initialTurnedCount ===
        Constants.SKYJO_DEFAULT_SETTINGS.CARDS.INITIAL_TURNED_COUNT &&
      this.cardPerRow === Constants.SKYJO_DEFAULT_SETTINGS.CARDS.PER_ROW &&
      this.cardPerColumn ===
        Constants.SKYJO_DEFAULT_SETTINGS.CARDS.PER_COLUMN &&
      this.scoreToEndGame ===
        Constants.SKYJO_DEFAULT_SETTINGS.SCORE_TO_END_GAME &&
      this.firstPlayerMultiplierPenalty ===
        Constants.SKYJO_DEFAULT_SETTINGS.FIRST_PLAYER_MULTIPLIER_PENALTY
    )
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
      firstPlayerMultiplierPenalty: this.firstPlayerMultiplierPenalty,
      firstPlayerScoreFlatPenalty: this.firstPlayerScoreFlatPenalty,
      firstPlayerPenaltyType: this.firstPlayerPenaltyType,
    } satisfies SkyjoSettingsToJson
  }
}
