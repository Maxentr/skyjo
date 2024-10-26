import type { SkyjoPopulate } from "@/types/skyjo.js"
import type { SkyjoSettingsToJson } from "@/types/skyjoSettings.js"
import type { ChangeSettings } from "@/validations/changeSettings.js"
import { Constants } from "../constants.js"

export interface SkyjoSettingsInterface {
  private: boolean
  maxPlayers: number
  allowSkyjoForColumn: boolean
  allowSkyjoForRow: boolean
  initialTurnedCount: number
  cardPerRow: number
  cardPerColumn: number

  toJson(): SkyjoSettingsToJson
}

export class SkyjoSettings implements SkyjoSettingsInterface {
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
  }

  populate(game: SkyjoPopulate) {
    this.private = game.private
    this.maxPlayers = game.maxPlayers
    this.allowSkyjoForColumn = game.allowSkyjoForColumn
    this.allowSkyjoForRow = game.allowSkyjoForRow
    this.initialTurnedCount = game.initialTurnedCount
    this.cardPerRow = game.cardPerRow
    this.cardPerColumn = game.cardPerColumn
    this.scoreToEndGame = game.scoreToEndGame
    this.multiplierForFirstPlayer = game.multiplierForFirstPlayer

    return this
  }

  changeSettings(settings: ChangeSettings) {
    this.private = settings.private
    this.allowSkyjoForColumn = settings.allowSkyjoForColumn
    this.allowSkyjoForRow = settings.allowSkyjoForRow
    this.initialTurnedCount = settings.initialTurnedCount
    this.cardPerRow = settings.cardPerRow
    this.cardPerColumn = settings.cardPerColumn
    this.scoreToEndGame = settings.scoreToEndGame
    this.multiplierForFirstPlayer = settings.multiplierForFirstPlayer
  }

  toJson() {
    return {
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
