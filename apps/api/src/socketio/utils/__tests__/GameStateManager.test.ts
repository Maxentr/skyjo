import {
  Constants as CoreConstants,
  Skyjo,
  SkyjoCard,
  SkyjoPlayer,
} from "@skyjo/core"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { GameStateManager } from "../GameStateManager.js"

describe("GameStateManager", () => {
  let game: Skyjo
  let manager: GameStateManager

  beforeEach(() => {
    const player = new SkyjoPlayer()
    game = new Skyjo(player.id)
    game.addPlayer(player)

    manager = new GameStateManager(game)
  })

  describe("getChanges", () => {
    it("returns null when no changes", () => {
      expect(manager.getChanges()).toBeNull()
    })

    describe("detects basic field changes", () => {
      it("detects one basic field change", () => {
        game.status = CoreConstants.GAME_STATUS.PLAYING

        expect(manager.getChanges()).toEqual({
          game: {
            status: CoreConstants.GAME_STATUS.PLAYING,
            stateVersion: 1,
          },
        })
      })

      it("detects multiple basic field changes", () => {
        game.status = CoreConstants.GAME_STATUS.PLAYING
        game.roundPhase = CoreConstants.ROUND_PHASE.MAIN
        game.turn = 1

        expect(manager.getChanges()).toEqual({
          game: {
            status: CoreConstants.GAME_STATUS.PLAYING,
            roundPhase: CoreConstants.ROUND_PHASE.MAIN,
            turn: 1,
            stateVersion: 1,
          },
        })
      })
    })

    describe("detects settings changes", () => {
      it("detects one settings change", () => {
        game.settings.maxPlayers = 6

        expect(manager.getChanges()).toEqual({
          settings: { maxPlayers: 6 },
          game: { stateVersion: 1 },
        })
      })

      it("detects multiple settings changes", () => {
        game.settings.allowSkyjoForColumn = false
        game.settings.allowSkyjoForRow = true
        game.settings.initialTurnedCount = 10

        expect(manager.getChanges()).toEqual({
          settings: {
            allowSkyjoForColumn: false,
            allowSkyjoForRow: true,
            initialTurnedCount: 10,
          },
          game: { stateVersion: 1 },
        })
      })
    })

    describe("detects players changes", () => {
      it("detects one basic player change", () => {
        const player = game.players[0]
        player.score = 10

        expect(manager.getChanges()).toEqual({
          updatePlayers: [{ id: player.id, score: 10 }],
          game: { stateVersion: 1 },
        })
      })

      it("detects multiple basic player changes", () => {
        const player = game.players[0]
        player.score = 10
        player.name = "John"
        player.connectionStatus =
          CoreConstants.CONNECTION_STATUS.CONNECTION_LOST
        player.cards = [[new SkyjoCard(1)], [new SkyjoCard(2)]]

        expect(manager.getChanges()).toEqual({
          updatePlayers: [
            {
              id: player.id,
              score: 10,
              name: "John",
              connectionStatus: CoreConstants.CONNECTION_STATUS.CONNECTION_LOST,
              cards: player.cards.map((row) =>
                row.map((card) => card.toJson()),
              ),
            },
          ],
          game: { stateVersion: 1 },
        })
      })

      it("detects player additions", () => {
        const newPlayer = new SkyjoPlayer()
        game.players.push(newPlayer)

        expect(manager.getChanges()).toEqual({
          addPlayers: [newPlayer.toJson()],
          game: { stateVersion: 1 },
        })
      })

      it("detects player removals", () => {
        const aPlayer = new SkyjoPlayer()
        game.addPlayer(aPlayer)
        manager.getChanges()

        game.removePlayer(aPlayer.id)

        expect(manager.getChanges()).toEqual({
          removePlayers: [aPlayer.id],
          game: { stateVersion: 2 },
        })
      })
    })
  })
})
