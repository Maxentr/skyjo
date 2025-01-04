import { Constants as ErrorConstants } from "@skyjo/error"
import { beforeEach, describe, expect, it } from "vitest"
import { Skyjo } from "../../class/Skyjo.js"
import { SkyjoCard } from "../../class/SkyjoCard.js"
import { SkyjoPlayer } from "../../class/SkyjoPlayer.js"
import { SkyjoSettings } from "../../class/SkyjoSettings.js"
import {
  Constants,
  type GameStatus,
  type LastTurnStatus,
  type RoundPhase,
  type TurnStatus,
} from "../../constants.js"
import type { SkyjoToDb } from "../../types/skyjo.js"
import "@skyjo/error/test/expect-extend"

const TOTAL_CARDS = 150
const CARDS_PER_PLAYER = 12

const TEST_SOCKET_ID = "socketId123"

describe("Skyjo", () => {
  let skyjo: Skyjo
  let player: SkyjoPlayer
  let settings: SkyjoSettings
  let opponent: SkyjoPlayer

  beforeEach(() => {
    player = new SkyjoPlayer(
      { username: "player1", avatar: Constants.AVATARS.BEE },
      TEST_SOCKET_ID,
    )
    settings = new SkyjoSettings()
    skyjo = new Skyjo(player.id, settings)
    skyjo.addPlayer(player)

    opponent = new SkyjoPlayer(
      { username: "opponent2", avatar: Constants.AVATARS.ELEPHANT },
      "socketId456",
    )
    skyjo.addPlayer(opponent)
  })

  //#region Game class
  describe("populate", () => {
    it("should populate the class without players", () => {
      const game: SkyjoToDb = {
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
      skyjo = new Skyjo(player.id)
      skyjo.populate(game)

      expect(skyjo.id).toBe(game.id)
      expect(skyjo.code).toBe(game.code)
      expect(skyjo.status).toBe(game.status)
      expect(skyjo.turn).toBe(game.turn)
      expect(skyjo.adminId).toBe(player.id)
      expect(structuredClone(skyjo.settings)).toStrictEqual(game.settings)
    })

    it("should populate the class with players", () => {
      const game: SkyjoToDb = {
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

      skyjo = new Skyjo(player.id)
      skyjo.populate(game)

      expect(skyjo.id).toBe(game.id)
      expect(skyjo.code).toBe(game.code)
      expect(skyjo.status).toBe(game.status)
      expect(skyjo.turn).toBe(game.turn)
      expect(skyjo.adminId).toBe(player.id)
      expect(structuredClone(skyjo.settings)).toStrictEqual(game.settings)
      expect(skyjo.players.length).toBe(1)
      expect(skyjo.players[0].name).toBe(game.players[0].name)
      expect(skyjo.players[0].socketId).toBe(game.players[0].socketId)
      expect(skyjo.players[0].avatar).toBe(game.players[0].avatar)
      expect(skyjo.players[0].score).toBe(game.players[0].score)
      expect(skyjo.players[0].wantsReplay).toBe(game.players[0].wantsReplay)
      expect(skyjo.players[0].cards).toStrictEqual(game.players[0].cards)
    })
  })

  describe("getPlayerById", () => {
    it("should get player", () => {
      expect(skyjo.getPlayerById(player.id)).toBe(player)
      expect(skyjo.getPlayerById(opponent.id)).toBe(opponent)
    })
  })

  describe("addPlayer", () => {
    it("should add player", () => {
      settings.maxPlayers = 3
      const newPlayer = new SkyjoPlayer(
        { username: "player3", avatar: Constants.AVATARS.TURTLE },
        "socketId789",
      )

      expect(() => skyjo.addPlayer(newPlayer)).not.toThrow()
      expect(skyjo.players).toHaveLength(3)
    })

    it("should not add player if max players is reached", () => {
      settings.maxPlayers = 2
      const newPlayer = new SkyjoPlayer(
        { username: "player3", avatar: Constants.AVATARS.TURTLE },
        "socketId789",
      )

      expect(() => skyjo.addPlayer(newPlayer)).toThrowCErrorWithCode(
        ErrorConstants.ERROR.GAME_IS_FULL,
      )
      expect(skyjo.players).toHaveLength(2)
    })
  })

  describe("isAdmin", () => {
    it("should check if the player is admin", () => {
      expect(skyjo.isAdmin(player.id)).toBeTruthy()
      expect(skyjo.isAdmin(opponent.id)).toBeFalsy()
    })
  })

  describe("changeAdmin", () => {
    it("should not change admin if there is no connected players", () => {
      for (const player of skyjo.players) {
        player.connectionStatus = Constants.CONNECTION_STATUS.DISCONNECTED
      }

      skyjo.changeAdmin()
      expect(skyjo.adminId).toBe(player.id)
    })

    it("should change admin", () => {
      skyjo.changeAdmin()
      expect(skyjo.adminId).toBe(opponent.id)
    })
  })

  describe("checkTurn", () => {
    it("should check if it's player turn", () => {
      expect(skyjo.checkTurn(player.id)).toBeTruthy()
      expect(skyjo.checkTurn(opponent.id)).toBeFalsy()
    })
  })

  describe("hasMinPlayersConnected", () => {
    it("should return true if there are at least min players connected", () => {
      expect(skyjo.hasMinPlayersConnected()).toBeTruthy()
    })

    it("should return false if there are less than min players connected", () => {
      skyjo.removePlayer(player.id)
      expect(skyjo.hasMinPlayersConnected()).toBeFalsy()
    })
  })
  //#endregion

  describe("start", () => {
    it("should not start the game if min players is not reached", () => {
      skyjo.removePlayer(opponent.id)
      expect(() => skyjo.start()).toThrowCErrorWithCode(
        ErrorConstants.ERROR.TOO_FEW_PLAYERS,
      )
    })

    it("should start the game with default settings", () => {
      skyjo.start()

      expect(skyjo.isPlaying()).toBeTruthy()
      expect(skyjo.roundPhase).toBe<RoundPhase>(
        Constants.ROUND_PHASE.TURN_CARDS,
      )
    })

    it("should start the game and set the round status to playing if there is no card to turn at the beginning of the game", () => {
      skyjo.settings.initialTurnedCount = 0
      skyjo.start()

      expect(skyjo.isPlaying()).toBeTruthy()
      expect(skyjo.roundPhase).toBe<RoundPhase>(Constants.ROUND_PHASE.MAIN)
    })
  })

  describe("haveAllPlayersRevealedCards", () => {
    it("should check all players revealed cards and return false if not all players have revealed cards", () => {
      skyjo.start()
      skyjo.settings.initialTurnedCount = 2

      expect(skyjo.haveAllPlayersRevealedCards()).toBeFalsy()
    })

    it("should check all players revealed cards and return true if all players have revealed cards", () => {
      skyjo.start()
      skyjo.settings.initialTurnedCount = 2
      skyjo.players.forEach((player) => {
        player.cards[0][0] = new SkyjoCard(10, true)
        player.cards[0][1] = new SkyjoCard(10, true)
      })

      expect(skyjo.haveAllPlayersRevealedCards()).toBeTruthy()
    })
  })

  describe("startRoundAfterInitialReveal", () => {
    it("should start the game and make the player with the highest current score start", () => {
      skyjo.start()
      skyjo.settings.initialTurnedCount = 2
      // player 1 has 10 and player 2 has 9 for the second card
      skyjo.players.forEach((player, i) => {
        player.cards[0][0] = new SkyjoCard(10, true)
        player.cards[0][1] = new SkyjoCard(1 - i, true)
      })

      skyjo.startRoundAfterInitialReveal()

      expect(skyjo.roundPhase).toBe<RoundPhase>(Constants.ROUND_PHASE.MAIN)
      expect(skyjo.turn).toBe(0)
    })

    it("should start the game and make the player with the highest card start when two players have the same current score", () => {
      skyjo.start()

      skyjo.players[0].cards[0][0] = new SkyjoCard(10, true)
      skyjo.players[0].cards[0][1] = new SkyjoCard(10, true)

      skyjo.players[1].cards[0][0] = new SkyjoCard(9, true)
      skyjo.players[1].cards[0][1] = new SkyjoCard(11, true)

      skyjo.startRoundAfterInitialReveal()

      expect(skyjo.roundPhase).toBe<RoundPhase>(Constants.ROUND_PHASE.MAIN)
      expect(skyjo.turn).toBe(1)
    })

    it("should start the game and make the player with the highest card start while ignoring players who are not connected", () => {
      const opponent2 = new SkyjoPlayer(
        { username: "player3", avatar: Constants.AVATARS.TURTLE },
        "socketId789",
      )
      skyjo.addPlayer(opponent2)

      const opponent3 = new SkyjoPlayer(
        { username: "player4", avatar: Constants.AVATARS.WHALE },
        "socketId789124",
      )
      skyjo.addPlayer(opponent3)

      skyjo.start()

      skyjo.players[0].connectionStatus =
        Constants.CONNECTION_STATUS.DISCONNECTED
      skyjo.players[0].cards[0][0] = new SkyjoCard(10, true)
      skyjo.players[0].cards[0][1] = new SkyjoCard(10, true)

      skyjo.players[1].cards[0][0] = new SkyjoCard(12, true)
      skyjo.players[1].cards[0][1] = new SkyjoCard(12, true)

      skyjo.players[2].connectionStatus =
        Constants.CONNECTION_STATUS.DISCONNECTED
      skyjo.players[2].cards[0][0] = new SkyjoCard(9, true)
      skyjo.players[2].cards[0][1] = new SkyjoCard(11, true)

      skyjo.players[3].cards[0][0] = new SkyjoCard(9, true)
      skyjo.players[3].cards[0][1] = new SkyjoCard(12, true)

      skyjo.startRoundAfterInitialReveal()

      expect(skyjo.roundPhase).toBe<RoundPhase>(Constants.ROUND_PHASE.MAIN)
      expect(skyjo.turn).toBe(1)
    })
  })

  describe("drawCard", () => {
    it("should draw card", () => {
      skyjo.start()

      expect(skyjo.selectedCardValue).toBeNull()
      expect(skyjo.turnStatus).toBe<TurnStatus>(
        Constants.TURN_STATUS.CHOOSE_A_PILE,
      )

      skyjo.drawCard()

      expect(skyjo.selectedCardValue).not.toBeNull()
      expect(skyjo.turnStatus).toBe<TurnStatus>(
        Constants.TURN_STATUS.THROW_OR_REPLACE,
      )
      expect(skyjo.lastTurnStatus).toBe<LastTurnStatus>(
        Constants.LAST_TURN_STATUS.PICK_FROM_DRAW_PILE,
      )
    })

    it("should draw card and reload the draw pile", () => {
      skyjo.start()

      skyjo["discardPile"] = [...skyjo["drawPile"], ...skyjo["discardPile"]]
      skyjo["drawPile"] = []

      const nbCardsUsedByPlayers = skyjo.players.length * CARDS_PER_PLAYER

      expect(skyjo.selectedCardValue).toBeNull()
      expect(skyjo.turnStatus).toBe<TurnStatus>(
        Constants.TURN_STATUS.CHOOSE_A_PILE,
      )
      expect(skyjo["drawPile"]).toHaveLength(0)
      expect(skyjo["discardPile"]).toHaveLength(
        TOTAL_CARDS - nbCardsUsedByPlayers,
      )

      skyjo.drawCard()

      expect(skyjo.selectedCardValue).not.toBeNull()
      expect(skyjo.turnStatus).toBe<TurnStatus>(
        Constants.TURN_STATUS.THROW_OR_REPLACE,
      )
      expect(skyjo.lastTurnStatus).toBe<LastTurnStatus>(
        Constants.LAST_TURN_STATUS.PICK_FROM_DRAW_PILE,
      )
      // 150(total cards) - 2(nb player) * 12(cards per player) - 1(draw pile) - 1(discard pile)
      expect(skyjo["drawPile"]).toHaveLength(
        TOTAL_CARDS - nbCardsUsedByPlayers - 1 - 1,
      )
      expect(skyjo["discardPile"]).toHaveLength(1)
    })
  })

  describe("pickFromDiscard", () => {
    it("should pick a card from the discard pile", () => {
      skyjo.start()
      skyjo["discardPile"].push(skyjo["drawPile"].splice(0, 1)[0])

      expect(skyjo.selectedCardValue).toBeNull()
      expect(skyjo.turnStatus).toBe<TurnStatus>(
        Constants.TURN_STATUS.CHOOSE_A_PILE,
      )

      skyjo.pickFromDiscard()

      expect(skyjo.selectedCardValue).not.toBeNull()
      expect(skyjo.turnStatus).toBe<TurnStatus>(
        Constants.TURN_STATUS.REPLACE_A_CARD,
      )
      expect(skyjo.lastTurnStatus).toBe<LastTurnStatus>(
        Constants.LAST_TURN_STATUS.PICK_FROM_DISCARD_PILE,
      )
    })

    it("should not pick a card from the discard pile if it's empty", () => {
      skyjo.start()
      skyjo["discardPile"] = []

      expect(skyjo.selectedCardValue).toBeNull()
      expect(skyjo.turnStatus).toBe<TurnStatus>(
        Constants.TURN_STATUS.CHOOSE_A_PILE,
      )

      skyjo.pickFromDiscard()

      expect(skyjo.selectedCardValue).toBeNull()
      expect(skyjo.turnStatus).toBe<TurnStatus>(
        Constants.TURN_STATUS.CHOOSE_A_PILE,
      )
    })
  })

  describe("discardCard", () => {
    it("should discard card", () => {
      skyjo.discardCard(10)

      expect(skyjo.selectedCardValue).toBeNull()
      expect(skyjo["discardPile"]).toHaveLength(1)
      expect(skyjo.turnStatus).toBe<TurnStatus>(
        Constants.TURN_STATUS.TURN_A_CARD,
      )
      expect(skyjo.lastTurnStatus).toBe<LastTurnStatus>(
        Constants.LAST_TURN_STATUS.THROW,
      )
    })
  })

  describe("replaceCard", () => {
    it("should replace a card", () => {
      skyjo.start()

      const oldCardValue = player.cards[0][0].value
      skyjo.turn = 0
      skyjo.selectedCardValue = 10

      skyjo.replaceCard(0, 0)

      expect(player.cards[0][0].isVisible).toBeTruthy()
      expect(player.cards[0][0].value).toBe(10)
      expect(skyjo["discardPile"]).include(oldCardValue)
      expect(skyjo.selectedCardValue).toBeNull()
      expect(player.cards[0][0].isVisible).toBeTruthy()
      expect(skyjo.lastTurnStatus).toBe<LastTurnStatus>(
        Constants.LAST_TURN_STATUS.REPLACE,
      )
    })
  })

  describe("turnCard", () => {
    it("should turn card", () => {
      skyjo.start()
      const card = player.cards[0][0]
      expect(card.isVisible).toBeFalsy()

      skyjo.turnCard(player, 0, 0)

      expect(card.isVisible).toBeTruthy()
      expect(skyjo.lastTurnStatus).toBe<LastTurnStatus>(
        Constants.LAST_TURN_STATUS.TURN,
      )
    })
  })

  describe("getLastDiscardCardValue", () => {
    it("should return the last discard value", () => {
      skyjo["discardPile"].push(0)

      expect(skyjo.getLastDiscardCardValue()).toBe(0)
    })
  })

  describe("nextTurn", () => {
    it("should set next turn", () => {
      const currentTurn = skyjo.turn
      skyjo.nextTurn()

      expect(skyjo.turn).not.toBe(currentTurn)
      expect(skyjo.turnStatus).toBe<TurnStatus>(
        Constants.TURN_STATUS.CHOOSE_A_PILE,
      )
    })

    it("should set next turn and handle disconnected players", () => {
      const opponent2 = new SkyjoPlayer(
        { username: "player3", avatar: Constants.AVATARS.TURTLE },
        "socketId789",
      )
      opponent2.connectionStatus = Constants.CONNECTION_STATUS.DISCONNECTED
      skyjo.addPlayer(opponent2)
      skyjo.turn = 1

      skyjo.nextTurn()

      expect(skyjo.turn).toBe(0)
      expect(skyjo.turnStatus).toBe<TurnStatus>(
        Constants.TURN_STATUS.CHOOSE_A_PILE,
      )
    })

    it("should set next turn and discard a column and not discard a row", () => {
      skyjo.settings.allowSkyjoForRow = false
      skyjo.settings.allowSkyjoForColumn = true
      skyjo.start()
      skyjo.turn = 0
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

      skyjo.nextTurn()

      expect(player.cards.length).toBe(3)
      player.cards.forEach((column) => {
        expect(column.length).toBe(3)
      })
    })

    it("should set next turn and discard a row but not discard a column", () => {
      skyjo.settings.allowSkyjoForRow = true
      skyjo.settings.allowSkyjoForColumn = false
      skyjo.start()
      skyjo.turn = 0
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

      skyjo.nextTurn()

      expect(player.cards.length).toBe(4)
      player.cards.forEach((column) => {
        expect(column.length).toBe(2)
      })
    })

    it("should set next turn and discard a column and a row", () => {
      skyjo.settings.allowSkyjoForRow = true
      skyjo.settings.allowSkyjoForColumn = true
      skyjo.start()
      skyjo.turn = 0
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

      skyjo.nextTurn()

      expect(player.cards.length).toBe(3)
      player.cards.forEach((column) => {
        expect(column.length).toBe(2)
      })
    })

    it("should set next turn and discard 2 column and 2 row", () => {
      skyjo.settings.allowSkyjoForRow = true
      skyjo.settings.allowSkyjoForColumn = true
      skyjo.start()
      skyjo.turn = 0
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

      skyjo.nextTurn()

      const remaningColumns = 2
      expect(player.cards.length).toBe(remaningColumns)

      const remaningCardsPerColumn = 1
      player.cards.forEach((column) => {
        expect(column.length).toBe(remaningCardsPerColumn)
      })
    })

    it("should set next turn and set the first player to finish", () => {
      skyjo.settings.allowSkyjoForRow = true
      skyjo.start()
      skyjo.turn = 0
      player.cards = [
        [
          new SkyjoCard(1, true),
          new SkyjoCard(1, true),
          new SkyjoCard(1, true),
        ],
      ]

      skyjo.nextTurn()

      expect(skyjo.firstToFinishPlayerId).toBe(player.id)
      expect(skyjo.isPlaying()).toBeTruthy()
      expect(skyjo.roundPhase).toBe<RoundPhase>(Constants.ROUND_PHASE.LAST_LAP)
    })

    it("should set next turn, not end the round", () => {
      skyjo.start()
      skyjo.roundPhase = Constants.ROUND_PHASE.MAIN
      skyjo.firstToFinishPlayerId = player.id
      skyjo.turn = 0

      skyjo.nextTurn()

      expect(skyjo.roundPhase).toBe<RoundPhase>(Constants.ROUND_PHASE.MAIN)
      expect(skyjo.isPlaying()).toBeTruthy()
    })

    it("should set next turn, end the round", () => {
      skyjo.start()
      skyjo.roundPhase = Constants.ROUND_PHASE.LAST_LAP
      skyjo.firstToFinishPlayerId = player.id
      skyjo.turn = 0

      opponent.hasPlayedLastTurn = true

      skyjo.nextTurn()

      expect(skyjo.roundPhase).toBe<RoundPhase>(Constants.ROUND_PHASE.OVER)
    })
  })

  describe("endRound", () => {
    it("should end the round and not apply penalty because first player has not been found", () => {
      skyjo.start()
      skyjo.roundPhase = Constants.ROUND_PHASE.LAST_LAP
      skyjo.firstToFinishPlayerId = null
      skyjo.turn = 0

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

      skyjo.endRound()

      expect(skyjo.roundPhase).toBe<RoundPhase>(Constants.ROUND_PHASE.OVER)
      expect(skyjo.firstToFinishPlayerId).toBeNull()
      expect(player.scores[0]).toBe(30)
      expect(opponent.scores[0]).toBe(1)
    })

    it("should end the round and not apply penalty because first player has disconnected", () => {
      skyjo.start()
      skyjo.roundPhase = Constants.ROUND_PHASE.LAST_LAP
      skyjo.firstToFinishPlayerId = player.id
      player.connectionStatus = Constants.CONNECTION_STATUS.DISCONNECTED
      skyjo.turn = 0

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

      skyjo.endRound()

      expect(skyjo.roundPhase).toBe<RoundPhase>(Constants.ROUND_PHASE.OVER)
      expect(player.scores[0]).toBe("-")
      expect(opponent.scores[0]).toBe(1)
    })

    it("should end the round and not apply penalty to the first player since no other player has a lower score", () => {
      skyjo.start()
      skyjo.roundPhase = Constants.ROUND_PHASE.LAST_LAP
      skyjo.firstToFinishPlayerId = player.id
      skyjo.turn = 0

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

      skyjo.endRound()

      expect(skyjo.roundPhase).toBe<RoundPhase>(Constants.ROUND_PHASE.OVER)
      expect(player.scores[0]).toBe(1)
      expect(opponent.scores[0]).toBe(2)
    })

    it("should end the round and not apply multiplier penalty to the first player if the the score is not positive", () => {
      skyjo.start()
      skyjo.settings.firstPlayerPenaltyType =
        Constants.FIRST_PLAYER_PENALTY_TYPE.MULTIPLIER_ONLY
      skyjo.settings.firstPlayerMultiplierPenalty = 2

      skyjo.firstToFinishPlayerId = player.id

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

      skyjo.endRound()

      expect(player.scores[0]).toBe(0)
      expect(opponent.scores[0]).toBe(-5)
    })

    it("should end the round and apply penalty to the first player if score is equal to another player", () => {
      skyjo.start()

      skyjo.firstToFinishPlayerId = player.id

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

      skyjo.endRound()

      expect(player.scores[0]).not.toBe(10 + 11 + 9)
      expect(opponent.scores[0]).toBe(10 + 11 + 9)
    })

    it("should end the round and apply penalty to the first player if a player has a lower score than the first player", () => {
      skyjo.start()

      skyjo.firstToFinishPlayerId = player.id

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

      skyjo.endRound()

      expect(player.scores[0]).not.toBe(10 + 11 + 9)
      expect(opponent.scores[0]).toBe(10 + 10 + 9)
    })

    it("should end the round and apply multiplier only penalty to the first player", () => {
      skyjo.start()
      skyjo.settings.firstPlayerPenaltyType =
        Constants.FIRST_PLAYER_PENALTY_TYPE.MULTIPLIER_ONLY
      skyjo.settings.firstPlayerMultiplierPenalty = 2

      skyjo.firstToFinishPlayerId = player.id

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

      skyjo.endRound()

      expect(player.scores[0]).toBe(
        (10 + 11 + 9) * skyjo.settings.firstPlayerMultiplierPenalty,
      )
      expect(opponent.scores[0]).toBe(10 + 10 + 9)
    })

    it("should end the round and apply only flat penalty to the first player", () => {
      skyjo.start()
      skyjo.settings.firstPlayerPenaltyType =
        Constants.FIRST_PLAYER_PENALTY_TYPE.FLAT_ONLY
      skyjo.settings.firstPlayerFlatPenalty = 10

      skyjo.firstToFinishPlayerId = player.id

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

      skyjo.endRound()

      expect(player.scores[0]).toBe(
        10 + 11 + 9 + skyjo.settings.firstPlayerFlatPenalty,
      )
      expect(opponent.scores[0]).toBe(0 + 0 + 1)
    })

    it("should end the round and apply flat then multiplier penalty to the first player", () => {
      skyjo.start()
      skyjo.settings.firstPlayerPenaltyType =
        Constants.FIRST_PLAYER_PENALTY_TYPE.FLAT_THEN_MULTIPLIER
      skyjo.settings.firstPlayerFlatPenalty = 20
      skyjo.settings.firstPlayerMultiplierPenalty = 3

      skyjo.firstToFinishPlayerId = player.id

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

      skyjo.endRound()

      expect(player.scores[0]).toBe(
        (10 + 11 + 9 + skyjo.settings.firstPlayerFlatPenalty) *
          skyjo.settings.firstPlayerMultiplierPenalty,
      )
      expect(opponent.scores[0]).toBe(0 + 0 + 1)
    })

    it("should end the round and apply multiplier then flat penalty to the first player", () => {
      skyjo.start()
      skyjo.settings.firstPlayerPenaltyType =
        Constants.FIRST_PLAYER_PENALTY_TYPE.MULTIPLIER_THEN_FLAT
      skyjo.settings.firstPlayerFlatPenalty = 20
      skyjo.settings.firstPlayerMultiplierPenalty = 3

      skyjo.firstToFinishPlayerId = player.id

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

      skyjo.endRound()

      expect(player.scores[0]).toBe(
        (10 + 11 + 9) * skyjo.settings.firstPlayerMultiplierPenalty +
          skyjo.settings.firstPlayerFlatPenalty,
      )
      expect(opponent.scores[0]).toBe(0 + 0 + 1)
    })
  })

  describe("startNewRound", () => {
    it("should start a new round and wait for players to turn initial cards if there is a card to turn at the beginning of the game", () => {
      skyjo.roundNumber = 1
      skyjo.firstToFinishPlayerId = player.id
      skyjo.selectedCardValue = 1
      skyjo.lastTurnStatus = Constants.LAST_TURN_STATUS.PICK_FROM_DRAW_PILE
      player.cards = [
        [
          new SkyjoCard(1, true),
          new SkyjoCard(1, true),
          new SkyjoCard(3, true),
        ],
      ]

      skyjo.startNewRound()

      expect(skyjo.roundNumber).toBe(2)
      expect(skyjo.firstToFinishPlayerId).toBeNull()
      expect(skyjo.selectedCardValue).toBeNull()
      expect(skyjo.lastTurnStatus).toBe<LastTurnStatus>(
        Constants.LAST_TURN_STATUS.TURN,
      )
      skyjo.players.forEach((player) => {
        expect(player.cards.flat()).toHaveLength(CARDS_PER_PLAYER)
        expect(player.hasRevealedCardCount(0)).toBeTruthy()
      })
      expect(skyjo.roundPhase).toBe<RoundPhase>(
        Constants.ROUND_PHASE.TURN_CARDS,
      )
      expect(skyjo.turnStatus).toBe<TurnStatus>(
        Constants.TURN_STATUS.CHOOSE_A_PILE,
      )
    })

    it("should start a new round and not wait for players to turn initial cards if there is no card to turn at the beginning of the game", () => {
      skyjo.settings.initialTurnedCount = 0
      skyjo.roundNumber = 1
      skyjo.firstToFinishPlayerId = player.id
      skyjo.selectedCardValue = 1
      skyjo.lastTurnStatus = Constants.LAST_TURN_STATUS.PICK_FROM_DRAW_PILE
      player.cards = [
        [
          new SkyjoCard(1, true),
          new SkyjoCard(1, true),
          new SkyjoCard(3, true),
        ],
      ]

      skyjo.startNewRound()

      expect(skyjo.roundNumber).toBe(2)
      expect(skyjo.firstToFinishPlayerId).toBeNull()
      expect(skyjo.selectedCardValue).toBeNull()
      expect(skyjo.lastTurnStatus).toBe<LastTurnStatus>(
        Constants.LAST_TURN_STATUS.TURN,
      )
      skyjo.players.forEach((player) => {
        expect(player.cards.flat()).toHaveLength(CARDS_PER_PLAYER)
        expect(player.hasRevealedCardCount(0)).toBeTruthy()
      })
      expect(skyjo.roundPhase).toBe<RoundPhase>(Constants.ROUND_PHASE.MAIN)
      expect(skyjo.turnStatus).toBe<TurnStatus>(
        Constants.TURN_STATUS.CHOOSE_A_PILE,
      )
    })
  })

  describe("restartGameIfAllPlayersWantReplay", () => {
    it("shouldn't restart the game", () => {
      skyjo.status = Constants.GAME_STATUS.FINISHED
      player.wantsReplay = false
      opponent.wantsReplay = true

      skyjo.restartGameIfAllPlayersWantReplay()

      expect(skyjo.isFinished()).toBeTruthy()
    })

    it("should restart the game", () => {
      skyjo.status = Constants.GAME_STATUS.FINISHED
      skyjo.players.forEach((player) => {
        player.wantsReplay = true
      })

      skyjo.restartGameIfAllPlayersWantReplay()

      expect(skyjo.isInLobby()).toBeTruthy()
    })
  })

  describe("resetRound", () => {
    it("should reset the round of the game", () => {
      skyjo.roundNumber = 10
      skyjo.players.forEach((player) => {
        player.scores = [10, 20]
        player.score = 30
        player.wantsReplay = true
      })

      skyjo.resetRound()

      expect(skyjo.roundNumber).toBe(1)
      skyjo.players.forEach((player) => {
        expect(player.scores).toStrictEqual([])
        expect(player.score).toBe(0)
        expect(player.wantsReplay).toBeFalsy()
      })
    })
  })

  describe("toJson", () => {
    it("should return json", () => {
      const gameToJson = skyjo.toJson()

      expect(gameToJson).toStrictEqual({
        code: skyjo.code,
        status: Constants.GAME_STATUS.LOBBY,
        roundPhase: Constants.ROUND_PHASE.TURN_CARDS,
        adminId: player.id,
        players: skyjo.players.map((player) => player.toJson()),
        selectedCardValue: null,
        lastDiscardCardValue: skyjo["discardPile"][["_discardPile"].length - 1],
        lastTurnStatus: Constants.LAST_TURN_STATUS.TURN,
        turn: 0,
        turnStatus: Constants.TURN_STATUS.CHOOSE_A_PILE,
        settings: skyjo.settings.toJson(),
        stateVersion: skyjo.stateVersion,
        updatedAt: skyjo.updatedAt,
      })
    })
  })

  describe("serializeGame", () => {
    it("should serialize game", () => {
      skyjo.start()

      const gameSerialized = skyjo.serializeGame()
      expect(gameSerialized).toStrictEqual({
        id: skyjo.id,
        adminId: player.id,
        code: skyjo.code,
        status: skyjo.status,
        isFull: skyjo.isFull(),
        drawPile: skyjo["drawPile"],
        discardPile: skyjo["discardPile"],
        firstToFinishPlayerId: skyjo.firstToFinishPlayerId,
        selectedCardValue: skyjo.selectedCardValue,
        roundNumber: skyjo.roundNumber,
        roundPhase: skyjo.roundPhase,
        turn: skyjo.turn,
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
        stateVersion: skyjo.stateVersion,
        createdAt: skyjo.createdAt,
        updatedAt: skyjo.updatedAt,
      })
    })
  })
})
