import type { SkyjoDbFormat } from "@/types/skyjo.js"
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
  firstPlayerFlatPenalty?: number
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
  maxPlayers: number = Constants.DEFAULT_GAME_SETTINGS.MAX_PLAYERS
  allowSkyjoForColumn: boolean =
    Constants.DEFAULT_GAME_SETTINGS.ALLOW_SKYJO_FOR_COLUMN
  allowSkyjoForRow: boolean =
    Constants.DEFAULT_GAME_SETTINGS.ALLOW_SKYJO_FOR_ROW
  initialTurnedCount: number =
    Constants.DEFAULT_GAME_SETTINGS.CARDS.INITIAL_TURNED_COUNT
  cardPerRow: number = Constants.DEFAULT_GAME_SETTINGS.CARDS.PER_ROW
  cardPerColumn: number = Constants.DEFAULT_GAME_SETTINGS.CARDS.PER_COLUMN
  scoreToEndGame: number = Constants.DEFAULT_GAME_SETTINGS.SCORE_TO_END_GAME
  firstPlayerMultiplierPenalty: number =
    Constants.DEFAULT_GAME_SETTINGS.FIRST_PLAYER_MULTIPLIER_PENALTY
  firstPlayerFlatPenalty: number =
    Constants.DEFAULT_GAME_SETTINGS.FIRST_PLAYER_FLAT_PENALTY
  firstPlayerPenaltyType: FirstPlayerPenaltyType =
    Constants.DEFAULT_GAME_SETTINGS.FIRST_PLAYER_PENALTY_TYPE

  constructor(isPrivate: boolean = false, maxPlayers?: number) {
    this.private = isPrivate
    if (isPrivate) this.isConfirmed = true
    if (maxPlayers) this.maxPlayers = maxPlayers
  }

  populate(settings: SkyjoDbFormat["settings"]) {
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
    this.firstPlayerFlatPenalty = settings.firstPlayerFlatPenalty
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
    this.firstPlayerFlatPenalty =
      settings.firstPlayerFlatPenalty ?? this.firstPlayerFlatPenalty
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

    if (this.firstPlayerFlatPenalty > this.scoreToEndGame) {
      this.firstPlayerFlatPenalty = this.scoreToEndGame
    }
  }

  isClassicSettings() {
    return (
      this.allowSkyjoForColumn ===
        Constants.DEFAULT_GAME_SETTINGS.ALLOW_SKYJO_FOR_COLUMN &&
      this.allowSkyjoForRow ===
        Constants.DEFAULT_GAME_SETTINGS.ALLOW_SKYJO_FOR_ROW &&
      this.initialTurnedCount ===
        Constants.DEFAULT_GAME_SETTINGS.CARDS.INITIAL_TURNED_COUNT &&
      this.cardPerRow === Constants.DEFAULT_GAME_SETTINGS.CARDS.PER_ROW &&
      this.cardPerColumn === Constants.DEFAULT_GAME_SETTINGS.CARDS.PER_COLUMN &&
      this.scoreToEndGame ===
        Constants.DEFAULT_GAME_SETTINGS.SCORE_TO_END_GAME &&
      this.firstPlayerMultiplierPenalty ===
        Constants.DEFAULT_GAME_SETTINGS.FIRST_PLAYER_MULTIPLIER_PENALTY &&
      this.firstPlayerPenaltyType ===
        Constants.DEFAULT_GAME_SETTINGS.FIRST_PLAYER_PENALTY_TYPE
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
      firstPlayerFlatPenalty: this.firstPlayerFlatPenalty,
      firstPlayerPenaltyType: this.firstPlayerPenaltyType,
    } satisfies SkyjoSettingsToJson
  }
}
