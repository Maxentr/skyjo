import { SkyjoSettings } from "@/class/SkyjoSettings"
import { DbGame } from "database/schema"
import {
  API_REGIONS_TAGS,
  GAME_STATUS,
  LAST_TURN_STATUS,
  ROUND_STATUS,
  SKYJO_DEFAULT_SETTINGS,
  TURN_STATUS,
} from "shared/constants"
import { beforeEach, describe, expect, it } from "vitest"

let settings: SkyjoSettings

describe("SkyjoSettings", () => {
  beforeEach(() => {
    settings = new SkyjoSettings()
  })

  it("should return default settings", () => {
    const defaultSettings = new SkyjoSettings()

    expect(defaultSettings.private).toBeFalsy()
    expect(defaultSettings.allowSkyjoForColumn).toBe(
      SKYJO_DEFAULT_SETTINGS.ALLOW_SKYJO_FOR_COLUMN,
    )
    expect(defaultSettings.allowSkyjoForRow).toBe(
      SKYJO_DEFAULT_SETTINGS.ALLOW_SKYJO_FOR_ROW,
    )
    expect(defaultSettings.initialTurnedCount).toBe(
      SKYJO_DEFAULT_SETTINGS.CARDS.INITIAL_TURNED_COUNT,
    )
    expect(defaultSettings.cardPerRow).toBe(
      SKYJO_DEFAULT_SETTINGS.CARDS.PER_ROW,
    )
    expect(defaultSettings.cardPerColumn).toBe(
      SKYJO_DEFAULT_SETTINGS.CARDS.PER_COLUMN,
    )
    expect(defaultSettings.maxPlayers).toBe(SKYJO_DEFAULT_SETTINGS.MAX_PLAYERS)
  })

  it("should populate the class", () => {
    const dbGame: DbGame = {
      id: crypto.randomUUID(),
      code: "code",
      status: GAME_STATUS.LOBBY,
      turn: 0,
      turnStatus: TURN_STATUS.CHOOSE_A_PILE,
      lastTurnStatus: LAST_TURN_STATUS.TURN,
      roundStatus: ROUND_STATUS.WAITING_PLAYERS_TO_TURN_INITIAL_CARDS,
      roundNumber: 1,
      discardPile: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      drawPile: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      selectedCardValue: null,
      lastDiscardCardValue: null,
      adminId: "adminId",
      firstToFinishPlayerId: null,

      allowSkyjoForColumn: false,
      allowSkyjoForRow: false,
      initialTurnedCount: 4,
      cardPerRow: 3,
      cardPerColumn: 4,
      scoreToEndGame: 101,
      multiplierForFirstPlayer: 1,
      maxPlayers: 2,
      isPrivate: true,

      isFull: false,

      region: API_REGIONS_TAGS["0"],
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const settings = new SkyjoSettings(false).populate(dbGame)

    expect(structuredClone(settings)).toStrictEqual({
      maxPlayers: dbGame.maxPlayers,
      private: dbGame.isPrivate,
      allowSkyjoForColumn: dbGame.allowSkyjoForColumn,
      allowSkyjoForRow: dbGame.allowSkyjoForRow,
      initialTurnedCount: dbGame.initialTurnedCount,
      cardPerRow: dbGame.cardPerRow,
      cardPerColumn: dbGame.cardPerColumn,
      scoreToEndGame: dbGame.scoreToEndGame,
      multiplierForFirstPlayer: dbGame.multiplierForFirstPlayer,
    })
  })
  it("should change settings", () => {
    const newSettings = {
      private: true,
      allowSkyjoForColumn: true,
      allowSkyjoForRow: true,
      initialTurnedCount: 2,
      cardPerRow: 6,
      cardPerColumn: 8,
      scoreToEndGame: 100,
      multiplierForFirstPlayer: 2,
    }

    settings.changeSettings(newSettings)

    expect(settings.allowSkyjoForColumn).toBeTruthy()
    expect(settings.allowSkyjoForRow).toBeTruthy()
    expect(settings.initialTurnedCount).toBe(2)
    expect(settings.cardPerRow).toBe(6)
    expect(settings.cardPerColumn).toBe(8)
    expect(settings.scoreToEndGame).toBe(100)
    expect(settings.multiplierForFirstPlayer).toBe(2)
  })

  it("should return json", () => {
    const settingsToJson = settings.toJson()

    expect(settingsToJson).toStrictEqual({
      private: false,
      allowSkyjoForColumn: true,
      allowSkyjoForRow: false,
      initialTurnedCount: 2,
      cardPerRow: 3,
      cardPerColumn: 4,
      maxPlayers: 8,
      scoreToEndGame: 100,
      multiplierForFirstPlayer: 2,
    })
  })
})
