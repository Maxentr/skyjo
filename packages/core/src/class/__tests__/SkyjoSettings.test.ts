import { beforeEach, describe, expect, it } from "vitest"
import { SkyjoSettings } from "../../class/SkyjoSettings.js"
import { Constants } from "../../constants.js"
import type { SkyjoDbFormat } from "../../types/skyjo.js"

let settings: SkyjoSettings

describe("SkyjoSettings", () => {
  beforeEach(() => {
    settings = new SkyjoSettings()
  })

  it("should return default settings", () => {
    const defaultSettings = new SkyjoSettings()

    expect(defaultSettings.isConfirmed).toBeFalsy()
    expect(defaultSettings.private).toBeFalsy()
    expect(defaultSettings.allowSkyjoForColumn).toBe(
      Constants.DEFAULT_GAME_SETTINGS.ALLOW_SKYJO_FOR_COLUMN,
    )
    expect(defaultSettings.allowSkyjoForRow).toBe(
      Constants.DEFAULT_GAME_SETTINGS.ALLOW_SKYJO_FOR_ROW,
    )
    expect(defaultSettings.initialTurnedCount).toBe(
      Constants.DEFAULT_GAME_SETTINGS.CARDS.INITIAL_TURNED_COUNT,
    )
    expect(defaultSettings.cardPerRow).toBe(
      Constants.DEFAULT_GAME_SETTINGS.CARDS.PER_ROW,
    )
    expect(defaultSettings.cardPerColumn).toBe(
      Constants.DEFAULT_GAME_SETTINGS.CARDS.PER_COLUMN,
    )
    expect(defaultSettings.maxPlayers).toBe(
      Constants.DEFAULT_GAME_SETTINGS.MAX_PLAYERS,
    )
  })

  it("should have the settings validation to true by default for private game", () => {
    const defaultSettings = new SkyjoSettings(true)

    expect(defaultSettings.isConfirmed).toBeTruthy()
  })

  it("should populate the class", () => {
    const dbGameSettings: SkyjoDbFormat["settings"] = {
      isConfirmed: true,
      allowSkyjoForColumn: false,
      allowSkyjoForRow: false,
      initialTurnedCount: 4,
      cardPerRow: 3,
      cardPerColumn: 4,
      scoreToEndGame: 101,
      firstPlayerMultiplierPenalty: 1,
      firstPlayerPenaltyType:
        Constants.FIRST_PLAYER_PENALTY_TYPE.MULTIPLIER_ONLY,
      firstPlayerFlatPenalty: 0,
      maxPlayers: 2,
      private: true,
    }

    const settings = new SkyjoSettings(false).populate(dbGameSettings)

    expect(structuredClone(settings)).toStrictEqual(dbGameSettings)
  })

  it("should update settings", () => {
    const newSettings = {
      isConfirmed: true,
      private: true,
      allowSkyjoForColumn: true,
      allowSkyjoForRow: true,
      initialTurnedCount: 2,
      cardPerRow: 6,
      cardPerColumn: 8,
      scoreToEndGame: 100,
      firstPlayerMultiplierPenalty: 2,
    }

    settings.updateSettings(newSettings)

    expect(settings.allowSkyjoForColumn).toBeTruthy()
    expect(settings.allowSkyjoForRow).toBeTruthy()
    expect(settings.initialTurnedCount).toBe(2)
    expect(settings.cardPerRow).toBe(6)
    expect(settings.cardPerColumn).toBe(8)
    expect(settings.scoreToEndGame).toBe(100)
    expect(settings.firstPlayerMultiplierPenalty).toBe(2)
  })

  describe("preventInvalidSettings", () => {
    it("should prevent invalid settings when initialTurnedCount is greater the number of cards on the board", () => {
      settings.cardPerColumn = 4
      settings.cardPerRow = 3
      settings.initialTurnedCount = 14
      settings.preventInvalidSettings()

      expect(settings.initialTurnedCount).toBe(11)
    })

    it("should prevent invalid settings when initialTurnedCount is equal to the number of cards on the board", () => {
      settings.cardPerColumn = 4
      settings.cardPerRow = 3
      settings.initialTurnedCount = 12
      settings.preventInvalidSettings()

      expect(settings.initialTurnedCount).toBe(11)
    })

    it("should prevent invalid settings when cardPerColumn and cardPerRow are both 1", () => {
      settings.cardPerColumn = 1
      settings.cardPerRow = 1
      settings.preventInvalidSettings()

      expect(settings.cardPerColumn).toBe(2)
    })

    it("should prevent invalid settings when firstPlayerFlatPenalty is greater than scoreToEndGame", () => {
      settings.firstPlayerFlatPenalty = 101
      settings.scoreToEndGame = 80
      settings.preventInvalidSettings()

      expect(settings.firstPlayerFlatPenalty).toBe(settings.scoreToEndGame)
    })
  })

  describe("isClassicSettings", () => {
    it("should return true if the settings are classic", () => {
      const settings = new SkyjoSettings()

      expect(settings.isClassicSettings()).toBeTruthy()
    })

    it("should return false if the settings are not classic", () => {
      const settings = new SkyjoSettings()
      settings.allowSkyjoForRow = true

      expect(settings.isClassicSettings()).toBeFalsy()
    })
  })

  it("should return json", () => {
    const settingsToJson = settings.toJson()

    expect(settingsToJson).toStrictEqual({
      isConfirmed: false,
      private: false,
      allowSkyjoForColumn: true,
      allowSkyjoForRow: false,
      initialTurnedCount: 2,
      cardPerRow: 3,
      cardPerColumn: 4,
      maxPlayers: 8,
      scoreToEndGame: 100,
      firstPlayerMultiplierPenalty: 2,
      firstPlayerPenaltyType:
        Constants.FIRST_PLAYER_PENALTY_TYPE.MULTIPLIER_ONLY,
      firstPlayerFlatPenalty: 0,
    })
  })
})
