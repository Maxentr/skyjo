import { Constants as ErrorConstants } from "@skyjo/error"
import { beforeEach, describe, expect, it } from "vitest"
import { Skyjo } from "../../class/Skyjo.js"
import { SkyjoCard } from "../../class/SkyjoCard.js"
import { SkyjoPlayer } from "../../class/SkyjoPlayer.js"
import { SkyjoSettings } from "../../class/SkyjoSettings.js"
import {
  Constants,
  type LastTurnStatus,
  type TurnStatus,
} from "../../constants.js"
import type { SkyjoToDb } from "../../types/skyjo.js"
import "@skyjo/error/test/expect-extend"

const TOTAL_CARDS = 150
const CARDS_PER_PLAYER = 12

const TEST_SOCKET_ID = "socketId123"

describe("Skyjo", () => {
  let game: Skyjo
  let player: SkyjoPlayer
  let settings: SkyjoSettings
  let opponent: SkyjoPlayer

  beforeEach(() => {
    player = new SkyjoPlayer(
      { username: "player1", avatar: Constants.AVATARS.BEE },
      TEST_SOCKET_ID,
    )
    settings = new SkyjoSettings()
    game = new Skyjo(player.id, settings)
    game.addPlayer(player)

    opponent = new SkyjoPlayer(
      { username: "opponent2", avatar: Constants.AVATARS.ELEPHANT },
      "socketId456",
    )
    game.addPlayer(opponent)
  })

  //#region Game class
  describe("populate", () => {
    it("should populate the class without players", () => {
      const gameDb: SkyjoToDb = {
        id: crypto.randomUUID(),
        code: "code",
        adminId: player.id,
        isFull: false,
        status: Constants.GAME_STATUS.LOBBY,
        turn: 0,
        turnStatus: Constants.TURN_STATUS.CHOOSE_A_PILE,
        lastTurnStatus: Constants.LAST_TURN_STATUS.TURN,
        roundPhase: Constants.ROUND_PHASE.TURN_CARDS,
        roundNumber: 1,
        discardPile: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        drawPile: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        selectedCardValue: null,
        firstToFinishPlayerId: null,
        players: [],

        settings: {
          isConfirmed: false,
          maxPlayers: 8,
          private: false,
          allowSkyjoForColumn: true,
          allowSkyjoForRow: false,
          initialTurnedCount: 2,
          cardPerRow: 3,
          cardPerColumn: 4,
          scoreToEndGame: 100,
          firstPlayerMultiplierPenalty: 2,
          firstPlayerPenaltyType:
            Constants.FIRST_PLAYER_PENALTY_TYPE.MULTIPLIER_ONLY,
          firstPlayerFlatPenalty: 0,
        },

        stateVersion: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      game = new Skyjo(player.id)
      game.populate(gameDb)

      expect(game.id).toBe(gameDb.id)
      expect(game.code).toBe(gameDb.code)
      expect(game.status).toBe(gameDb.status)
      expect(game.turn).toBe(gameDb.turn)
      expect(game.adminId).toBe(gameDb.adminId)
      expect(structuredClone(game.settings)).toStrictEqual(gameDb.settings)
    })

    it("should populate the class with players", () => {
      const gameDb: SkyjoToDb = {
        id: crypto.randomUUID(),
        adminId: player.id,
        isFull: false,
        code: "code",
        status: Constants.GAME_STATUS.LOBBY,
        turn: 0,
        turnStatus: Constants.TURN_STATUS.CHOOSE_A_PILE,
        lastTurnStatus: Constants.LAST_TURN_STATUS.TURN,
        roundPhase: Constants.ROUND_PHASE.TURN_CARDS,
        roundNumber: 1,
        discardPile: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        drawPile: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        selectedCardValue: null,
        firstToFinishPlayerId: null,
        players: [
          {
            id: crypto.randomUUID(),
            name: "player1",
            avatar: Constants.AVATARS.BEE,
            socketId: TEST_SOCKET_ID,
            connectionStatus: Constants.CONNECTION_STATUS.CONNECTED,
            score: 10,
            scores: [5, 5],
            wantsReplay: true,
            cards: [
              [new SkyjoCard(0), new SkyjoCard(1), new SkyjoCard(2)],
              [new SkyjoCard(3), new SkyjoCard(4), new SkyjoCard(5)],
              [new SkyjoCard(6), new SkyjoCard(7), new SkyjoCard(8)],
            ],
            hasPlayedLastTurn: false,
          },
        ],

        settings: {
          isConfirmed: true,
          private: true,
          maxPlayers: 8,
          allowSkyjoForColumn: true,
          allowSkyjoForRow: false,
          initialTurnedCount: 2,
          cardPerRow: 3,
          cardPerColumn: 4,
          scoreToEndGame: 100,
          firstPlayerMultiplierPenalty: 2,
          firstPlayerPenaltyType:
            Constants.FIRST_PLAYER_PENALTY_TYPE.MULTIPLIER_ONLY,
          firstPlayerFlatPenalty: 0,
        },

        stateVersion: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      game = new Skyjo(player.id)
      game.populate(gameDb)

      expect(game.id).toBe(gameDb.id)
      expect(game.code).toBe(gameDb.code)
      expect(game.status).toBe(gameDb.status)
      expect(game.turn).toBe(gameDb.turn)
      expect(game.adminId).toBe(gameDb.adminId)
      expect(structuredClone(game.settings)).toStrictEqual(gameDb.settings)
      expect(game.players.length).toBe(1)
      expect(game.players[0].name).toBe(gameDb.players[0].name)
      expect(game.players[0].socketId).toBe(gameDb.players[0].socketId)
      expect(game.players[0].avatar).toBe(gameDb.players[0].avatar)
      expect(game.players[0].score).toBe(gameDb.players[0].score)
      expect(game.players[0].wantsReplay).toBe(gameDb.players[0].wantsReplay)
      expect(game.players[0].cards).toStrictEqual(gameDb.players[0].cards)
    })
  })

  describe("getPlayerById", () => {
    it("should get player", () => {
      expect(game.getPlayerById(player.id)).toBe(player)
      expect(game.getPlayerById(opponent.id)).toBe(opponent)
    })
  })

  describe("addPlayer", () => {
    it("should add player", () => {
      settings.maxPlayers = 3
      const newPlayer = new SkyjoPlayer(
        { username: "player3", avatar: Constants.AVATARS.TURTLE },
        "socketId789",
      )

      expect(() => game.addPlayer(newPlayer)).not.toThrow()
      expect(game.players).toHaveLength(3)
    })

    it("should not add player if max players is reached", () => {
      settings.maxPlayers = 2
      const newPlayer = new SkyjoPlayer(
        { username: "player3", avatar: Constants.AVATARS.TURTLE },
        "socketId789",
      )

      expect(() => game.addPlayer(newPlayer)).toThrowCErrorWithCode(
        ErrorConstants.ERROR.GAME_IS_FULL,
      )
      expect(game.players).toHaveLength(2)
    })
  })

  describe("isAdmin", () => {
    it("should check if the player is admin", () => {
      expect(game.isAdmin(player.id)).toBeTruthy()
      expect(game.isAdmin(opponent.id)).toBeFalsy()
    })
  })

  describe("changeAdmin", () => {
    it("should not change admin if there is no connected players", () => {
      for (const player of game.players) {
        player.connectionStatus = Constants.CONNECTION_STATUS.DISCONNECTED
      }

      game.changeAdmin()
      expect(game.adminId).toBe(player.id)
    })

    it("should change admin", () => {
      game.changeAdmin()
      expect(game.adminId).toBe(opponent.id)
    })
  })

  describe("checkTurn", () => {
    it("should check if it's player turn", () => {
      expect(game.checkTurn(player.id)).toBeTruthy()
      expect(game.checkTurn(opponent.id)).toBeFalsy()
    })
  })

  describe("hasMinPlayersConnected", () => {
    it("should return true if there are at least min players connected", () => {
      expect(game.hasMinPlayersConnected()).toBeTruthy()
    })

    it("should return false if there are less than min players connected", () => {
      game.removePlayer(player.id)
      expect(game.hasMinPlayersConnected()).toBeFalsy()
    })
  })
  //#endregion

  describe("start", () => {
    it("should not start the game if min players is not reached", () => {
      game.removePlayer(opponent.id)
      expect(() => game.start()).toThrowCErrorWithCode(
        ErrorConstants.ERROR.TOO_FEW_PLAYERS,
      )
    })

    it("should start the game with default settings", () => {
      game.start()

      expect(game.isPlaying()).toBeTruthy()
      expect(game.isRoundTurningCards()).toBeTruthy()
    })

    it("should start the game and set the round status to playing if there is no card to turn at the beginning of the game", () => {
      game.settings.initialTurnedCount = 0
      game.start()

      expect(game.isPlaying()).toBeTruthy()
      expect(game.isRoundInMain()).toBeTruthy()
    })
  })

  describe("haveAllPlayersRevealedCards", () => {
    it("should check all players revealed cards and return false if not all players have revealed cards", () => {
      game.start()
      game.settings.initialTurnedCount = 2

      expect(game.haveAllPlayersRevealedCards()).toBeFalsy()
    })

    it("should check all players revealed cards and return true if all players have revealed cards", () => {
      game.start()
      game.settings.initialTurnedCount = 2
      game.players.forEach((player) => {
        player.cards[0][0] = new SkyjoCard(10, true)
        player.cards[0][1] = new SkyjoCard(10, true)
      })

      expect(game.haveAllPlayersRevealedCards()).toBeTruthy()
    })
  })

  describe("startRoundAfterInitialReveal", () => {
    it("should start the game and make the player with the highest current score start", () => {
      game.start()
      game.settings.initialTurnedCount = 2
      // player 1 has 10 and player 2 has 9 for the second card
      game.players.forEach((player, i) => {
        player.cards[0][0] = new SkyjoCard(10, true)
        player.cards[0][1] = new SkyjoCard(1 - i, true)
      })

      game.startRoundAfterInitialReveal()

      expect(game.isRoundInMain()).toBeTruthy()
      expect(game.turn).toBe(0)
    })

    it("should start the game and make the player with the highest card start when two players have the same current score", () => {
      game.start()

      game.players[0].cards[0][0] = new SkyjoCard(10, true)
      game.players[0].cards[0][1] = new SkyjoCard(10, true)

      game.players[1].cards[0][0] = new SkyjoCard(9, true)
      game.players[1].cards[0][1] = new SkyjoCard(11, true)

      game.startRoundAfterInitialReveal()

      expect(game.isRoundInMain()).toBeTruthy()
      expect(game.turn).toBe(1)
    })

    it("should start the game and make the player with the highest card start while ignoring players who are not connected", () => {
      const opponent2 = new SkyjoPlayer(
        { username: "player3", avatar: Constants.AVATARS.TURTLE },
        "socketId789",
      )
      game.addPlayer(opponent2)

      const opponent3 = new SkyjoPlayer(
        { username: "player4", avatar: Constants.AVATARS.WHALE },
        "socketId789124",
      )
      game.addPlayer(opponent3)

      game.start()

      game.players[0].connectionStatus =
        Constants.CONNECTION_STATUS.DISCONNECTED
      game.players[0].cards[0][0] = new SkyjoCard(10, true)
      game.players[0].cards[0][1] = new SkyjoCard(10, true)

      game.players[1].cards[0][0] = new SkyjoCard(12, true)
      game.players[1].cards[0][1] = new SkyjoCard(12, true)

      game.players[2].connectionStatus =
        Constants.CONNECTION_STATUS.DISCONNECTED
      game.players[2].cards[0][0] = new SkyjoCard(9, true)
      game.players[2].cards[0][1] = new SkyjoCard(11, true)

      game.players[3].cards[0][0] = new SkyjoCard(9, true)
      game.players[3].cards[0][1] = new SkyjoCard(12, true)

      game.startRoundAfterInitialReveal()

      expect(game.isRoundInMain()).toBeTruthy()
      expect(game.turn).toBe(1)
    })
  })

  describe("drawCard", () => {
    it("should draw card", () => {
      game.start()

      expect(game.selectedCardValue).toBeNull()
      expect(game.turnStatus).toBe<TurnStatus>(
        Constants.TURN_STATUS.CHOOSE_A_PILE,
      )

      game.drawCard()

      expect(game.selectedCardValue).not.toBeNull()
      expect(game.turnStatus).toBe<TurnStatus>(
        Constants.TURN_STATUS.THROW_OR_REPLACE,
      )
      expect(game.lastTurnStatus).toBe<LastTurnStatus>(
        Constants.LAST_TURN_STATUS.PICK_FROM_DRAW_PILE,
      )
    })

    it("should draw card and reload the draw pile", () => {
      game.start()

      game["discardPile"] = [...game["drawPile"], ...game["discardPile"]]
      game["drawPile"] = []

      const nbCardsUsedByPlayers = game.players.length * CARDS_PER_PLAYER

      expect(game.selectedCardValue).toBeNull()
      expect(game.turnStatus).toBe<TurnStatus>(
        Constants.TURN_STATUS.CHOOSE_A_PILE,
      )
      expect(game["drawPile"]).toHaveLength(0)
      expect(game["discardPile"]).toHaveLength(
        TOTAL_CARDS - nbCardsUsedByPlayers,
      )

      game.drawCard()

      expect(game.selectedCardValue).not.toBeNull()
      expect(game.turnStatus).toBe<TurnStatus>(
        Constants.TURN_STATUS.THROW_OR_REPLACE,
      )
      expect(game.lastTurnStatus).toBe<LastTurnStatus>(
        Constants.LAST_TURN_STATUS.PICK_FROM_DRAW_PILE,
      )
      // 150(total cards) - 2(nb player) * 12(cards per player) - 1(draw pile) - 1(discard pile)
      expect(game["drawPile"]).toHaveLength(
        TOTAL_CARDS - nbCardsUsedByPlayers - 1 - 1,
      )
      expect(game["discardPile"]).toHaveLength(1)
    })
  })

  describe("pickFromDiscard", () => {
    it("should pick a card from the discard pile", () => {
      game.start()
      game["discardPile"].push(game["drawPile"].splice(0, 1)[0])

      expect(game.selectedCardValue).toBeNull()
      expect(game.turnStatus).toBe<TurnStatus>(
        Constants.TURN_STATUS.CHOOSE_A_PILE,
      )

      game.pickFromDiscard()

      expect(game.selectedCardValue).not.toBeNull()
      expect(game.turnStatus).toBe<TurnStatus>(
        Constants.TURN_STATUS.REPLACE_A_CARD,
      )
      expect(game.lastTurnStatus).toBe<LastTurnStatus>(
        Constants.LAST_TURN_STATUS.PICK_FROM_DISCARD_PILE,
      )
    })

    it("should not pick a card from the discard pile if it's empty", () => {
      game.start()
      game["discardPile"] = []

      expect(game.selectedCardValue).toBeNull()
      expect(game.turnStatus).toBe<TurnStatus>(
        Constants.TURN_STATUS.CHOOSE_A_PILE,
      )

      game.pickFromDiscard()

      expect(game.selectedCardValue).toBeNull()
      expect(game.turnStatus).toBe<TurnStatus>(
        Constants.TURN_STATUS.CHOOSE_A_PILE,
      )
    })
  })

  describe("discardCard", () => {
    it("should discard card", () => {
      game.discardCard(10)

      expect(game.selectedCardValue).toBeNull()
      expect(game["discardPile"]).toHaveLength(1)
      expect(game.turnStatus).toBe<TurnStatus>(
        Constants.TURN_STATUS.TURN_A_CARD,
      )
      expect(game.lastTurnStatus).toBe<LastTurnStatus>(
        Constants.LAST_TURN_STATUS.THROW,
      )
    })
  })

  describe("replaceCard", () => {
    it("should replace a card", () => {
      game.start()

      const oldCardValue = player.cards[0][0].value
      game.turn = 0
      game.selectedCardValue = 10

      game.replaceCard(0, 0)

      expect(player.cards[0][0].isVisible).toBeTruthy()
      expect(player.cards[0][0].value).toBe(10)
      expect(game["discardPile"]).include(oldCardValue)
      expect(game.selectedCardValue).toBeNull()
      expect(player.cards[0][0].isVisible).toBeTruthy()
      expect(game.lastTurnStatus).toBe<LastTurnStatus>(
        Constants.LAST_TURN_STATUS.REPLACE,
      )
    })
  })

  describe("turnCard", () => {
    it("should turn card", () => {
      game.start()
      const card = player.cards[0][0]
      expect(card.isVisible).toBeFalsy()

      game.turnCard(player, 0, 0)

      expect(card.isVisible).toBeTruthy()
      expect(game.lastTurnStatus).toBe<LastTurnStatus>(
        Constants.LAST_TURN_STATUS.TURN,
      )
    })
  })

  describe("getLastDiscardCardValue", () => {
    it("should return the last discard value", () => {
      game["discardPile"].push(0)

      expect(game.getLastDiscardCardValue()).toBe(0)
    })
  })

  describe("nextTurn", () => {
    it("should set next turn", () => {
      const currentTurn = game.turn
      game.nextTurn()

      expect(game.turn).not.toBe(currentTurn)
      expect(game.turnStatus).toBe<TurnStatus>(
        Constants.TURN_STATUS.CHOOSE_A_PILE,
      )
    })

    it("should set next turn and handle disconnected players", () => {
      const opponent2 = new SkyjoPlayer(
        { username: "player3", avatar: Constants.AVATARS.TURTLE },
        "socketId789",
      )
      opponent2.connectionStatus = Constants.CONNECTION_STATUS.DISCONNECTED
      game.addPlayer(opponent2)
      game.turn = 1

      game.nextTurn()

      expect(game.turn).toBe(0)
      expect(game.turnStatus).toBe<TurnStatus>(
        Constants.TURN_STATUS.CHOOSE_A_PILE,
      )
    })

    it("should set next turn and discard a column and not discard a row", () => {
      game.settings.allowSkyjoForRow = false
      game.settings.allowSkyjoForColumn = true
      game.start()
      game.turn = 0
      player.cards = [
        [
          new SkyjoCard(1, true),
          new SkyjoCard(1, true),
          new SkyjoCard(1, true),
        ],
        [
          new SkyjoCard(1, true),
          new SkyjoCard(3, true),
          new SkyjoCard(3, true),
        ],
        [
          new SkyjoCard(1, true),
          new SkyjoCard(3, true),
          new SkyjoCard(3, true),
        ],
        [
          new SkyjoCard(1, true),
          new SkyjoCard(3, true),
          new SkyjoCard(3, true),
        ],
      ]

      game.nextTurn()

      expect(player.cards.length).toBe(3)
      player.cards.forEach((column) => {
        expect(column.length).toBe(3)
      })
    })

    it("should set next turn and discard a row but not discard a column", () => {
      game.settings.allowSkyjoForRow = true
      game.settings.allowSkyjoForColumn = false
      game.start()
      game.turn = 0
      player.cards = [
        [
          new SkyjoCard(1, true),
          new SkyjoCard(1, true),
          new SkyjoCard(1, true),
        ],
        [
          new SkyjoCard(1, true),
          new SkyjoCard(3, true),
          new SkyjoCard(3, true),
        ],
        [
          new SkyjoCard(1, true),
          new SkyjoCard(3, true),
          new SkyjoCard(3, true),
        ],
        [
          new SkyjoCard(1, true),
          new SkyjoCard(3, true),
          new SkyjoCard(3, true),
        ],
      ]

      game.nextTurn()

      expect(player.cards.length).toBe(4)
      player.cards.forEach((column) => {
        expect(column.length).toBe(2)
      })
    })

    it("should set next turn and discard a column and a row", () => {
      game.settings.allowSkyjoForRow = true
      game.settings.allowSkyjoForColumn = true
      game.start()
      game.turn = 0
      player.cards = [
        [
          new SkyjoCard(1, true),
          new SkyjoCard(1, true),
          new SkyjoCard(1, true),
        ],
        [
          new SkyjoCard(1, true),
          new SkyjoCard(2, true),
          new SkyjoCard(3, true),
        ],
        [
          new SkyjoCard(1, true),
          new SkyjoCard(6, true),
          new SkyjoCard(7, true),
        ],
        [
          new SkyjoCard(1, true),
          new SkyjoCard(9, true),
          new SkyjoCard(10, true),
        ],
      ]

      game.nextTurn()

      expect(player.cards.length).toBe(3)
      player.cards.forEach((column) => {
        expect(column.length).toBe(2)
      })
    })

    it("should set next turn and discard 2 column and 2 row", () => {
      game.settings.allowSkyjoForRow = true
      game.settings.allowSkyjoForColumn = true
      game.start()
      game.turn = 0
      player.cards = [
        [
          new SkyjoCard(1, true),
          new SkyjoCard(1, true),
          new SkyjoCard(1, true),
        ],
        [
          new SkyjoCard(1, true),
          new SkyjoCard(2, true),
          new SkyjoCard(2, true),
        ],
        [
          new SkyjoCard(1, true),
          new SkyjoCard(6, true),
          new SkyjoCard(5, true),
        ],
        [
          new SkyjoCard(1, true),
          new SkyjoCard(6, true),
          new SkyjoCard(10, true),
        ],
      ]

      game.nextTurn()

      const remaningColumns = 2
      expect(player.cards.length).toBe(remaningColumns)

      const remaningCardsPerColumn = 1
      player.cards.forEach((column) => {
        expect(column.length).toBe(remaningCardsPerColumn)
      })
    })

    it("should set next turn and set the first player to finish", () => {
      game.settings.allowSkyjoForRow = true
      game.start()
      game.turn = 0
      player.cards = [
        [
          new SkyjoCard(1, true),
          new SkyjoCard(1, true),
          new SkyjoCard(1, true),
        ],
      ]

      game.nextTurn()

      expect(game.firstToFinishPlayerId).toBe(player.id)
      expect(game.isPlaying()).toBeTruthy()
      expect(game.isRoundInLastLap()).toBeTruthy()
    })

    it("should set next turn, not end the round", () => {
      game.start()
      game.roundPhase = Constants.ROUND_PHASE.MAIN
      game.firstToFinishPlayerId = player.id
      game.turn = 0

      game.nextTurn()

      expect(game.isRoundInMain()).toBeTruthy()
      expect(game.isPlaying()).toBeTruthy()
    })

    it("should set next turn, end the round", () => {
      game.start()
      game.roundPhase = Constants.ROUND_PHASE.LAST_LAP
      game.firstToFinishPlayerId = player.id
      game.turn = 0

      opponent.hasPlayedLastTurn = true

      game.nextTurn()

      expect(game.isRoundOver()).toBeTruthy()
    })
  })

  describe("endRound", () => {
    it("should end the round and not apply penalty because first player has not been found", () => {
      game.start()
      game.roundPhase = Constants.ROUND_PHASE.LAST_LAP
      game.firstToFinishPlayerId = null
      game.turn = 0

      player.cards = [
        [
          new SkyjoCard(10, true),
          new SkyjoCard(11, true),
          new SkyjoCard(9, true),
        ],
      ]
      opponent.cards = [
        [
          new SkyjoCard(0, true),
          new SkyjoCard(0, true),
          new SkyjoCard(1, true),
        ],
      ]

      game.endRound()

      expect(game.isRoundOver()).toBeTruthy()
      expect(game.firstToFinishPlayerId).toBeNull()
      expect(player.scores[0]).toBe(30)
      expect(opponent.scores[0]).toBe(1)
    })

    it("should end the round and not apply penalty because first player has disconnected", () => {
      game.start()
      game.roundPhase = Constants.ROUND_PHASE.LAST_LAP
      game.firstToFinishPlayerId = player.id
      player.connectionStatus = Constants.CONNECTION_STATUS.DISCONNECTED
      game.turn = 0

      player.cards = [
        [
          new SkyjoCard(10, true),
          new SkyjoCard(11, true),
          new SkyjoCard(9, true),
        ],
      ]
      opponent.cards = [
        [
          new SkyjoCard(0, true),
          new SkyjoCard(0, true),
          new SkyjoCard(1, true),
        ],
      ]

      game.endRound()

      expect(game.isRoundOver()).toBeTruthy()
      expect(player.scores[0]).toBe("-")
      expect(opponent.scores[0]).toBe(1)
    })

    it("should end the round and not apply penalty to the first player since no other player has a lower score", () => {
      game.start()
      game.roundPhase = Constants.ROUND_PHASE.LAST_LAP
      game.firstToFinishPlayerId = player.id
      game.turn = 0

      player.cards = [
        [
          new SkyjoCard(0, true),
          new SkyjoCard(0, true),
          new SkyjoCard(1, true),
        ],
      ]
      opponent.cards = [
        [
          new SkyjoCard(0, true),
          new SkyjoCard(0, true),
          new SkyjoCard(2, true),
        ],
      ]

      game.endRound()

      expect(game.isRoundOver()).toBeTruthy()
      expect(player.scores[0]).toBe(1)
      expect(opponent.scores[0]).toBe(2)
    })

    it("should end the round and not apply multiplier penalty to the first player if the the score is not positive", () => {
      game.start()
      game.settings.firstPlayerPenaltyType =
        Constants.FIRST_PLAYER_PENALTY_TYPE.MULTIPLIER_ONLY
      game.settings.firstPlayerMultiplierPenalty = 2

      game.firstToFinishPlayerId = player.id

      player.cards = [
        [
          new SkyjoCard(0, true),
          new SkyjoCard(-1, true),
          new SkyjoCard(1, true),
        ],
      ]
      opponent.cards = [
        [
          new SkyjoCard(-2, true),
          new SkyjoCard(-2, true),
          new SkyjoCard(-1, true),
        ],
      ]

      game.endRound()

      expect(player.scores[0]).toBe(0)
      expect(opponent.scores[0]).toBe(-5)
    })

    it("should end the round and apply penalty to the first player if score is equal to another player", () => {
      game.start()

      game.firstToFinishPlayerId = player.id

      player.cards = [
        [
          new SkyjoCard(10, true),
          new SkyjoCard(11, true),
          new SkyjoCard(9, true),
        ],
      ]
      opponent.cards = [
        [
          new SkyjoCard(10, true),
          new SkyjoCard(11, true),
          new SkyjoCard(9, true),
        ],
      ]

      game.endRound()

      expect(player.scores[0]).not.toBe(10 + 11 + 9)
      expect(opponent.scores[0]).toBe(10 + 11 + 9)
    })

    it("should end the round and apply penalty to the first player if a player has a lower score than the first player", () => {
      game.start()

      game.firstToFinishPlayerId = player.id

      player.cards = [
        [
          new SkyjoCard(10, true),
          new SkyjoCard(11, true),
          new SkyjoCard(9, true),
        ],
      ]
      opponent.cards = [
        [
          new SkyjoCard(10, true),
          new SkyjoCard(10, true),
          new SkyjoCard(9, true),
        ],
      ]

      game.endRound()

      expect(player.scores[0]).not.toBe(10 + 11 + 9)
      expect(opponent.scores[0]).toBe(10 + 10 + 9)
    })

    it("should end the round and apply multiplier only penalty to the first player", () => {
      game.start()
      game.settings.firstPlayerPenaltyType =
        Constants.FIRST_PLAYER_PENALTY_TYPE.MULTIPLIER_ONLY
      game.settings.firstPlayerMultiplierPenalty = 2

      game.firstToFinishPlayerId = player.id

      player.cards = [
        [
          new SkyjoCard(10, true),
          new SkyjoCard(11, true),
          new SkyjoCard(9, true),
        ],
      ]
      opponent.cards = [
        [
          new SkyjoCard(10, true),
          new SkyjoCard(10, true),
          new SkyjoCard(9, true),
        ],
      ]

      game.endRound()

      expect(player.scores[0]).toBe(
        (10 + 11 + 9) * game.settings.firstPlayerMultiplierPenalty,
      )
      expect(opponent.scores[0]).toBe(10 + 10 + 9)
    })

    it("should end the round and apply only flat penalty to the first player", () => {
      game.start()
      game.settings.firstPlayerPenaltyType =
        Constants.FIRST_PLAYER_PENALTY_TYPE.FLAT_ONLY
      game.settings.firstPlayerFlatPenalty = 10

      game.firstToFinishPlayerId = player.id

      player.cards = [
        [
          new SkyjoCard(10, true),
          new SkyjoCard(11, true),
          new SkyjoCard(9, true),
        ],
      ]
      opponent.cards = [
        [
          new SkyjoCard(0, true),
          new SkyjoCard(0, true),
          new SkyjoCard(1, true),
        ],
      ]

      game.endRound()

      expect(player.scores[0]).toBe(
        10 + 11 + 9 + game.settings.firstPlayerFlatPenalty,
      )
      expect(opponent.scores[0]).toBe(0 + 0 + 1)
    })

    it("should end the round and apply flat then multiplier penalty to the first player", () => {
      game.start()
      game.settings.firstPlayerPenaltyType =
        Constants.FIRST_PLAYER_PENALTY_TYPE.FLAT_THEN_MULTIPLIER
      game.settings.firstPlayerFlatPenalty = 20
      game.settings.firstPlayerMultiplierPenalty = 3

      game.firstToFinishPlayerId = player.id

      player.cards = [
        [
          new SkyjoCard(10, true),
          new SkyjoCard(11, true),
          new SkyjoCard(9, true),
        ],
      ]
      opponent.cards = [
        [
          new SkyjoCard(0, true),
          new SkyjoCard(0, true),
          new SkyjoCard(1, true),
        ],
      ]

      game.endRound()

      expect(player.scores[0]).toBe(
        (10 + 11 + 9 + game.settings.firstPlayerFlatPenalty) *
          game.settings.firstPlayerMultiplierPenalty,
      )
      expect(opponent.scores[0]).toBe(0 + 0 + 1)
    })

    it("should end the round and apply multiplier then flat penalty to the first player", () => {
      game.start()
      game.settings.firstPlayerPenaltyType =
        Constants.FIRST_PLAYER_PENALTY_TYPE.MULTIPLIER_THEN_FLAT
      game.settings.firstPlayerFlatPenalty = 20
      game.settings.firstPlayerMultiplierPenalty = 3

      game.firstToFinishPlayerId = player.id

      player.cards = [
        [
          new SkyjoCard(10, true),
          new SkyjoCard(11, true),
          new SkyjoCard(9, true),
        ],
      ]
      opponent.cards = [
        [
          new SkyjoCard(0, true),
          new SkyjoCard(0, true),
          new SkyjoCard(1, true),
        ],
      ]

      game.endRound()

      expect(player.scores[0]).toBe(
        (10 + 11 + 9) * game.settings.firstPlayerMultiplierPenalty +
          game.settings.firstPlayerFlatPenalty,
      )
      expect(opponent.scores[0]).toBe(0 + 0 + 1)
    })
  })

  describe("startNewRound", () => {
    it("should start a new round and wait for players to turn initial cards if there is a card to turn at the beginning of the game", () => {
      game.roundNumber = 1
      game.firstToFinishPlayerId = player.id
      game.selectedCardValue = 1
      game.lastTurnStatus = Constants.LAST_TURN_STATUS.PICK_FROM_DRAW_PILE
      player.cards = [
        [
          new SkyjoCard(1, true),
          new SkyjoCard(1, true),
          new SkyjoCard(3, true),
        ],
      ]

      game.startNewRound()

      expect(game.roundNumber).toBe(2)
      expect(game.firstToFinishPlayerId).toBeNull()
      expect(game.selectedCardValue).toBeNull()
      expect(game.lastTurnStatus).toBe<LastTurnStatus>(
        Constants.LAST_TURN_STATUS.TURN,
      )
      game.players.forEach((player) => {
        expect(player.cards.flat()).toHaveLength(CARDS_PER_PLAYER)
        expect(player.hasRevealedCardCount(0)).toBeTruthy()
      })
      expect(game.isRoundTurningCards()).toBeTruthy()
      expect(game.turnStatus).toBe<TurnStatus>(
        Constants.TURN_STATUS.CHOOSE_A_PILE,
      )
    })

    it("should start a new round and not wait for players to turn initial cards if there is no card to turn at the beginning of the game", () => {
      game.settings.initialTurnedCount = 0
      game.roundNumber = 1
      game.firstToFinishPlayerId = player.id
      game.selectedCardValue = 1
      game.lastTurnStatus = Constants.LAST_TURN_STATUS.PICK_FROM_DRAW_PILE
      player.cards = [
        [
          new SkyjoCard(1, true),
          new SkyjoCard(1, true),
          new SkyjoCard(3, true),
        ],
      ]

      game.startNewRound()

      expect(game.roundNumber).toBe(2)
      expect(game.firstToFinishPlayerId).toBeNull()
      expect(game.selectedCardValue).toBeNull()
      expect(game.lastTurnStatus).toBe<LastTurnStatus>(
        Constants.LAST_TURN_STATUS.TURN,
      )
      game.players.forEach((player) => {
        expect(player.cards.flat()).toHaveLength(CARDS_PER_PLAYER)
        expect(player.hasRevealedCardCount(0)).toBeTruthy()
      })
      expect(game.isRoundInMain()).toBeTruthy()
      expect(game.turnStatus).toBe<TurnStatus>(
        Constants.TURN_STATUS.CHOOSE_A_PILE,
      )
    })
  })

  describe("restartGameIfAllPlayersWantReplay", () => {
    it("shouldn't restart the game", () => {
      game.status = Constants.GAME_STATUS.FINISHED
      player.wantsReplay = false
      opponent.wantsReplay = true

      game.restartGameIfAllPlayersWantReplay()

      expect(game.isFinished()).toBeTruthy()
    })

    it("should restart the game", () => {
      game.status = Constants.GAME_STATUS.FINISHED
      game.players.forEach((player) => {
        player.wantsReplay = true
      })

      game.restartGameIfAllPlayersWantReplay()

      expect(game.isInLobby()).toBeTruthy()
    })
  })

  describe("resetRound", () => {
    it("should reset the round of the game", () => {
      game.roundNumber = 10
      game.players.forEach((player) => {
        player.scores = [10, 20]
        player.score = 30
        player.wantsReplay = true
      })

      game.resetRound()

      expect(game.roundNumber).toBe(1)
      game.players.forEach((player) => {
        expect(player.scores).toStrictEqual([])
        expect(player.score).toBe(0)
        expect(player.wantsReplay).toBeFalsy()
      })
    })
  })

  describe("toJson", () => {
    it("should return json", () => {
      const gameToJson = game.toJson()

      expect(gameToJson).toStrictEqual({
        code: game.code,
        status: Constants.GAME_STATUS.LOBBY,
        roundPhase: Constants.ROUND_PHASE.TURN_CARDS,
        adminId: player.id,
        players: game.players.map((player) => player.toJson()),
        selectedCardValue: null,
        lastDiscardCardValue: game["discardPile"][["_discardPile"].length - 1],
        lastTurnStatus: Constants.LAST_TURN_STATUS.TURN,
        turn: 0,
        turnStatus: Constants.TURN_STATUS.CHOOSE_A_PILE,
        settings: game.settings.toJson(),
        stateVersion: game.stateVersion,
        updatedAt: game.updatedAt,
      })
    })
  })

  describe("serializeGame", () => {
    it("should serialize game", () => {
      game.start()

      const gameSerialized = game.serializeGame()
      expect(gameSerialized).toStrictEqual({
        id: game.id,
        adminId: player.id,
        code: game.code,
        status: game.status,
        isFull: game.isFull(),
        drawPile: game["drawPile"],
        discardPile: game["discardPile"],
        firstToFinishPlayerId: game.firstToFinishPlayerId,
        selectedCardValue: game.selectedCardValue,
        roundNumber: game.roundNumber,
        roundPhase: game.roundPhase,
        turn: game.turn,
        turnStatus: Constants.TURN_STATUS.CHOOSE_A_PILE,
        lastTurnStatus: Constants.LAST_TURN_STATUS.TURN,
        players: [
          {
            id: player.id,
            name: player.name,
            avatar: Constants.AVATARS.BEE,
            cards: player.cards.map((column) =>
              column.map((card) => ({
                id: card.id,
                value: card.value,
                isVisible: card.isVisible,
              })),
            ),
            connectionStatus: player.connectionStatus,
            hasPlayedLastTurn: player.hasPlayedLastTurn,
            score: player.score,
            scores: player.scores,
            socketId: player.socketId,
            wantsReplay: player.wantsReplay,
          },
          {
            id: opponent.id,
            name: opponent.name,
            avatar: Constants.AVATARS.ELEPHANT,
            cards: opponent.cards.map((column) =>
              column.map((card) => ({
                id: card.id,
                value: card.value,
                isVisible: card.isVisible,
              })),
            ),
            connectionStatus: opponent.connectionStatus,
            hasPlayedLastTurn: opponent.hasPlayedLastTurn,
            score: opponent.score,
            scores: opponent.scores,
            socketId: opponent.socketId,
            wantsReplay: opponent.wantsReplay,
          },
        ],
        settings: {
          isConfirmed: false,
          allowSkyjoForColumn: true,
          allowSkyjoForRow: false,
          cardPerColumn: 4,
          cardPerRow: 3,
          initialTurnedCount: 2,
          maxPlayers: 8,
          private: false,
          scoreToEndGame: 100,
          firstPlayerMultiplierPenalty: 2,
          firstPlayerPenaltyType:
            Constants.FIRST_PLAYER_PENALTY_TYPE.MULTIPLIER_ONLY,
          firstPlayerFlatPenalty: 0,
        },
        stateVersion: game.stateVersion,
        createdAt: game.createdAt,
        updatedAt: game.updatedAt,
      })
    })
  })
})
