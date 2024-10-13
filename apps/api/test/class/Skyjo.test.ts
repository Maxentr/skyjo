import { Skyjo } from "@/class/Skyjo"
import { SkyjoCard } from "@/class/SkyjoCard"
import { SkyjoPlayer } from "@/class/SkyjoPlayer"
import { SkyjoSettings } from "@/class/SkyjoSettings"
import { DbGame, DbPlayer } from "database/schema"
import {
  API_REGIONS_TAGS,
  AVATARS,
  CONNECTION_STATUS,
  ERROR,
  GAME_STATUS,
  GameStatus,
  LAST_TURN_STATUS,
  LastTurnStatus,
  ROUND_STATUS,
  RoundStatus,
  TURN_STATUS,
  TurnStatus,
} from "shared/constants"
import { beforeEach, describe, expect, it } from "vitest"
import { TEST_SOCKET_ID } from "../constants"

const TOTAL_CARDS = 150
const CARDS_PER_PLAYER = 12

describe("Skyjo", () => {
  let skyjo: Skyjo
  let player: SkyjoPlayer
  let settings: SkyjoSettings
  let opponent: SkyjoPlayer

  beforeEach(() => {
    player = new SkyjoPlayer(
      { username: "player1", avatar: AVATARS.BEE },
      TEST_SOCKET_ID,
    )
    settings = new SkyjoSettings()
    skyjo = new Skyjo(player.id, settings)
    skyjo.addPlayer(player)

    opponent = new SkyjoPlayer(
      { username: "opponent2", avatar: AVATARS.ELEPHANT },
      "socketId456",
    )
    skyjo.addPlayer(opponent)
  })

  //#region Game class
  describe("populate", () => {
    it("should populate the class without players", () => {
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
        adminId: player.id,
        firstToFinishPlayerId: null,

        maxPlayers: 8,
        isPrivate: false,
        allowSkyjoForColumn: true,
        allowSkyjoForRow: false,
        initialTurnedCount: 2,
        cardPerRow: 3,
        cardPerColumn: 4,
        scoreToEndGame: 100,
        multiplierForFirstPlayer: 2,

        isFull: false,

        region: API_REGIONS_TAGS["0"],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      skyjo = new Skyjo(dbGame.adminId)
      skyjo.populate(dbGame, { players: [] })

      expect(skyjo.id).toBe(dbGame.id)
      expect(skyjo.code).toBe(dbGame.code)
      expect(skyjo.status).toBe(dbGame.status)
      expect(skyjo.turn).toBe(dbGame.turn)
      expect(skyjo.adminId).toBe(dbGame.adminId)
      expect(structuredClone(skyjo.settings)).toStrictEqual({
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

    it("should populate the class with players", () => {
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
        adminId: player.id,
        firstToFinishPlayerId: null,

        maxPlayers: 8,
        isPrivate: false,
        allowSkyjoForColumn: true,
        allowSkyjoForRow: false,
        initialTurnedCount: 2,
        cardPerRow: 3,
        cardPerColumn: 4,
        scoreToEndGame: 100,
        multiplierForFirstPlayer: 2,

        isFull: false,

        region: API_REGIONS_TAGS["0"],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const players: DbPlayer[] = [
        {
          id: crypto.randomUUID(),
          name: "player1",
          avatar: AVATARS.BEE,
          socketId: TEST_SOCKET_ID,
          connectionStatus: CONNECTION_STATUS.CONNECTED,
          score: 10,
          scores: [5, 5],
          wantsReplay: true,
          cards: [
            [new SkyjoCard(0), new SkyjoCard(1), new SkyjoCard(2)],
            [new SkyjoCard(3), new SkyjoCard(4), new SkyjoCard(5)],
            [new SkyjoCard(6), new SkyjoCard(7), new SkyjoCard(8)],
          ],

          disconnectionDate: null,
          gameId: dbGame.id,
        },
      ]

      skyjo.populate(dbGame, { players })

      expect(skyjo.id).toBe(dbGame.id)
      expect(skyjo.code).toBe(dbGame.code)
      expect(skyjo.status).toBe(dbGame.status)
      expect(skyjo.turn).toBe(dbGame.turn)
      expect(skyjo.adminId).toBe(dbGame.adminId)
      expect(structuredClone(skyjo.settings)).toStrictEqual({
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
      expect(skyjo.players.length).toBe(1)
      expect(skyjo.players[0].name).toBe(players[0].name)
      expect(skyjo.players[0].socketId).toBe(players[0].socketId)
      expect(skyjo.players[0].avatar).toBe(players[0].avatar)
      expect(skyjo.players[0].score).toBe(players[0].score)
      expect(skyjo.players[0].wantsReplay).toBe(players[0].wantsReplay)
      expect(skyjo.players[0].cards).toStrictEqual(players[0].cards)
    })
  })

  it("should get player", () => {
    expect(skyjo.getPlayerById(player.id)).toBe(player)
    expect(skyjo.getPlayerById(opponent.id)).toBe(opponent)
  })

  describe("add player", () => {
    it("should add player", () => {
      settings.maxPlayers = 3
      const newPlayer = new SkyjoPlayer(
        { username: "player3", avatar: AVATARS.TURTLE },
        "socketId789",
      )

      expect(() => skyjo.addPlayer(newPlayer)).not.toThrowError()
      expect(skyjo.players).toHaveLength(3)
    })

    it("should not add player if max players is reached", () => {
      settings.maxPlayers = 2
      const newPlayer = new SkyjoPlayer(
        { username: "player3", avatar: AVATARS.TURTLE },
        "socketId789",
      )

      expect(() => skyjo.addPlayer(newPlayer)).toThrowError(ERROR.GAME_IS_FULL)
      expect(skyjo.players).toHaveLength(2)
    })
  })

  it("should check if the player is admin", () => {
    expect(skyjo.isAdmin(player.id)).toBeTruthy()
    expect(skyjo.isAdmin(opponent.id)).toBeFalsy()
  })

  it("should check if it's player turn", () => {
    expect(skyjo.checkTurn(player.id)).toBeTruthy()
    expect(skyjo.checkTurn(opponent.id)).toBeFalsy()
  })

  describe("have at least min players connected", () => {
    it("should return true if there are at least min players connected", () => {
      expect(skyjo.haveAtLeastMinPlayersConnected()).toBeTruthy()
    })

    it("should return false if there are less than min players connected", () => {
      skyjo.removePlayer(player.id)
      expect(skyjo.haveAtLeastMinPlayersConnected()).toBeFalsy()
    })
  })
  //#endregion

  describe("start", () => {
    it("should not start the game if min players is not reached", () => {
      skyjo.removePlayer(opponent.id)
      expect(() => skyjo.start()).toThrowError(ERROR.TOO_FEW_PLAYERS)
    })

    it("should start the game with default settings", () => {
      skyjo.start()

      expect(skyjo.status).toBe<GameStatus>(GAME_STATUS.PLAYING)
      expect(skyjo.roundStatus).toBe<RoundStatus>(
        ROUND_STATUS.WAITING_PLAYERS_TO_TURN_INITIAL_CARDS,
      )
    })

    it("should start the game and set the round status to playing if there is no card to turn at the beginning of the game", () => {
      skyjo.settings.initialTurnedCount = 0
      skyjo.start()

      expect(skyjo.status).toBe<GameStatus>(GAME_STATUS.PLAYING)
      expect(skyjo.roundStatus).toBe<RoundStatus>(ROUND_STATUS.PLAYING)
    })
  })

  describe("check all players revealed cards", () => {
    it("should check all players revealed cards and not start the game", () => {
      skyjo.checkAllPlayersRevealedCards(skyjo.settings.initialTurnedCount)
      expect(skyjo.roundStatus).toBe<RoundStatus>(
        ROUND_STATUS.WAITING_PLAYERS_TO_TURN_INITIAL_CARDS,
      )
    })

    it("should check all players revealed cards, start the game and make the player with the highest current score start", () => {
      skyjo.start()
      // player 1 has 10 and player 2 has 9 for the second card
      skyjo.players.forEach((player, i) => {
        player.cards[0][0] = new SkyjoCard(10, true)
        player.cards[0][1] = new SkyjoCard(1 - i, true)
      })

      skyjo.checkAllPlayersRevealedCards(skyjo.settings.initialTurnedCount)

      expect(skyjo.roundStatus).toBe<RoundStatus>(ROUND_STATUS.PLAYING)
      expect(skyjo.turn).toBe(0)
    })

    it("should check all players revealed cards, start the game and make the player with the highest card start when two players have the same current score", () => {
      skyjo.start()

      skyjo.players[0].cards[0][0] = new SkyjoCard(10, true)
      skyjo.players[0].cards[0][1] = new SkyjoCard(10, true)

      skyjo.players[1].cards[0][0] = new SkyjoCard(9, true)
      skyjo.players[1].cards[0][1] = new SkyjoCard(11, true)

      skyjo.checkAllPlayersRevealedCards(skyjo.settings.initialTurnedCount)

      expect(skyjo.roundStatus).toBe<RoundStatus>(ROUND_STATUS.PLAYING)
      expect(skyjo.turn).toBe(1)
    })

    it("should check all players revealed cards, start the game and make the player with the highest card start while ignoring players who are not connected", () => {
      const opponent2 = new SkyjoPlayer(
        { username: "player3", avatar: AVATARS.TURTLE },
        "socketId789",
      )
      skyjo.addPlayer(opponent2)

      const opponent3 = new SkyjoPlayer(
        { username: "player4", avatar: AVATARS.WHALE },
        "socketId789124",
      )
      skyjo.addPlayer(opponent3)

      skyjo.start()

      skyjo.players[0].connectionStatus = CONNECTION_STATUS.DISCONNECTED
      skyjo.players[0].cards[0][0] = new SkyjoCard(10, true)
      skyjo.players[0].cards[0][1] = new SkyjoCard(10, true)

      skyjo.players[1].cards[0][0] = new SkyjoCard(12, true)
      skyjo.players[1].cards[0][1] = new SkyjoCard(12, true)

      skyjo.players[2].connectionStatus = CONNECTION_STATUS.DISCONNECTED
      skyjo.players[2].cards[0][0] = new SkyjoCard(9, true)
      skyjo.players[2].cards[0][1] = new SkyjoCard(11, true)

      skyjo.players[3].cards[0][0] = new SkyjoCard(9, true)
      skyjo.players[3].cards[0][1] = new SkyjoCard(12, true)

      skyjo.checkAllPlayersRevealedCards(skyjo.settings.initialTurnedCount)

      expect(skyjo.roundStatus).toBe<RoundStatus>(ROUND_STATUS.PLAYING)
      expect(skyjo.turn).toBe(1)
    })
  })

  describe("draw card", () => {
    it("should draw card", () => {
      skyjo.start()

      expect(skyjo.selectedCardValue).toBeNull()
      expect(skyjo.turnStatus).toBe<TurnStatus>(TURN_STATUS.CHOOSE_A_PILE)

      skyjo.drawCard()

      expect(skyjo.selectedCardValue).not.toBeNull()
      expect(skyjo.turnStatus).toBe<TurnStatus>(TURN_STATUS.THROW_OR_REPLACE)
      expect(skyjo.lastTurnStatus).toBe<LastTurnStatus>(
        LAST_TURN_STATUS.PICK_FROM_DRAW_PILE,
      )
    })

    it("should draw card and reload the draw pile", () => {
      skyjo.start()

      skyjo["discardPile"] = [...skyjo["drawPile"], ...skyjo["discardPile"]]
      skyjo["drawPile"] = []

      const nbCardsUsedByPlayers = skyjo.players.length * CARDS_PER_PLAYER

      expect(skyjo.selectedCardValue).toBeNull()
      expect(skyjo.turnStatus).toBe<TurnStatus>(TURN_STATUS.CHOOSE_A_PILE)
      expect(skyjo["drawPile"]).toHaveLength(0)
      expect(skyjo["discardPile"]).toHaveLength(
        TOTAL_CARDS - nbCardsUsedByPlayers,
      )

      skyjo.drawCard()

      expect(skyjo.selectedCardValue).not.toBeNull()
      expect(skyjo.turnStatus).toBe<TurnStatus>(TURN_STATUS.THROW_OR_REPLACE)
      expect(skyjo.lastTurnStatus).toBe<LastTurnStatus>(
        LAST_TURN_STATUS.PICK_FROM_DRAW_PILE,
      )
      // 150(total cards) - 2(nb player) * 12(cards per player) - 1(draw pile) - 1(discard pile)
      expect(skyjo["drawPile"]).toHaveLength(
        TOTAL_CARDS - nbCardsUsedByPlayers - 1 - 1,
      )
      expect(skyjo["discardPile"]).toHaveLength(1)
    })
  })

  describe("pick from discard pile", () => {
    it("should pick a card from the discard pile", () => {
      skyjo.start()
      skyjo["discardPile"].push(skyjo["drawPile"].splice(0, 1)[0])

      expect(skyjo.selectedCardValue).toBeNull()
      expect(skyjo.turnStatus).toBe<TurnStatus>(TURN_STATUS.CHOOSE_A_PILE)

      skyjo.pickFromDiscard()

      expect(skyjo.selectedCardValue).not.toBeNull()
      expect(skyjo.turnStatus).toBe<TurnStatus>(TURN_STATUS.REPLACE_A_CARD)
      expect(skyjo.lastTurnStatus).toBe<LastTurnStatus>(
        LAST_TURN_STATUS.PICK_FROM_DISCARD_PILE,
      )
    })

    it("should not pick a card from the discard pile if it's empty", () => {
      skyjo.start()
      skyjo["discardPile"] = []

      expect(skyjo.selectedCardValue).toBeNull()
      expect(skyjo.turnStatus).toBe<TurnStatus>(TURN_STATUS.CHOOSE_A_PILE)

      skyjo.pickFromDiscard()

      expect(skyjo.selectedCardValue).toBeNull()
      expect(skyjo.turnStatus).toBe<TurnStatus>(TURN_STATUS.CHOOSE_A_PILE)
    })
  })

  it("should discard card", () => {
    skyjo.discardCard(10)

    expect(skyjo.selectedCardValue).toBeNull()
    expect(skyjo["discardPile"]).toHaveLength(1)
    expect(skyjo.turnStatus).toBe<TurnStatus>(TURN_STATUS.TURN_A_CARD)
    expect(skyjo.lastTurnStatus).toBe<LastTurnStatus>(LAST_TURN_STATUS.THROW)
  })

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
    expect(skyjo.lastTurnStatus).toBe<LastTurnStatus>(LAST_TURN_STATUS.REPLACE)
  })

  it("should turn card", () => {
    skyjo.start()
    const card = player.cards[0][0]
    expect(card.isVisible).toBeFalsy()

    skyjo.turnCard(player, 0, 0)

    expect(card.isVisible).toBeTruthy()
    expect(skyjo.lastTurnStatus).toBe<LastTurnStatus>(LAST_TURN_STATUS.TURN)
  })

  describe("next turn", () => {
    it("should set next turn", () => {
      const currentTurn = skyjo.turn
      skyjo.nextTurn()

      expect(skyjo.turn).not.toBe(currentTurn)
      expect(skyjo.turnStatus).toBe<TurnStatus>(TURN_STATUS.CHOOSE_A_PILE)
    })

    it("should set next turn and handle disconnected players", () => {
      const opponent2 = new SkyjoPlayer(
        { username: "player3", avatar: AVATARS.TURTLE },
        "socketId789",
      )
      opponent2.connectionStatus = CONNECTION_STATUS.DISCONNECTED
      skyjo.addPlayer(opponent2)
      skyjo.turn = 1

      skyjo.nextTurn()

      expect(skyjo.turn).toBe(0)
      expect(skyjo.turnStatus).toBe<TurnStatus>(TURN_STATUS.CHOOSE_A_PILE)
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
      expect(skyjo.status).toBe<GameStatus>(GAME_STATUS.PLAYING)
      expect(skyjo.roundStatus).toBe<RoundStatus>(ROUND_STATUS.LAST_LAP)
    })

    it("should set next turn, end the round and not end the game", () => {
      skyjo.start()
      skyjo.roundStatus = ROUND_STATUS.PLAYING
      skyjo.firstToFinishPlayerId = player.id
      skyjo.turn = 0

      skyjo.nextTurn()

      expect(skyjo.roundStatus).toBe<RoundStatus>(ROUND_STATUS.PLAYING)
      expect(skyjo.status).toBe<GameStatus>(GAME_STATUS.PLAYING)
    })

    it("should set next turn, end the round and not double score of the first player", () => {
      skyjo.start()
      skyjo.firstToFinishPlayerId = player.id
      skyjo.roundStatus = ROUND_STATUS.LAST_LAP
      player.hasPlayedLastTurn = true
      skyjo.turn = 1

      player.cards = [
        [
          new SkyjoCard(1, true),
          new SkyjoCard(1, true),
          new SkyjoCard(3, true),
        ],
      ]
      opponent.cards = [
        [
          new SkyjoCard(1, true),
          new SkyjoCard(1, true),
          new SkyjoCard(4, true),
        ],
      ]

      skyjo.nextTurn()

      expect(skyjo.roundStatus).toBe<RoundStatus>(ROUND_STATUS.OVER)
      expect(skyjo.status).toBe<GameStatus>(GAME_STATUS.PLAYING)
      expect(player.score).toBe(1 + 1 + 3)
    })

    it("should set next turn, end the round and double score of the first player", () => {
      skyjo.start()
      skyjo.firstToFinishPlayerId = player.id
      skyjo.roundStatus = ROUND_STATUS.LAST_LAP
      player.hasPlayedLastTurn = true
      skyjo.turn = 1

      player.cards = [
        [
          new SkyjoCard(1, true),
          new SkyjoCard(1, true),
          new SkyjoCard(3, true),
        ],
      ]
      opponent.cards = [
        [
          new SkyjoCard(1, true),
          new SkyjoCard(1, true),
          new SkyjoCard(2, true),
        ],
      ]

      skyjo.nextTurn()

      expect(skyjo.roundStatus).toBe<RoundStatus>(ROUND_STATUS.OVER)
      expect(skyjo.status).toBe<GameStatus>(GAME_STATUS.PLAYING)
      expect(player.score).toBe((1 + 1 + 3) * 2)
    })

    it("should set next turn, end the round and not double score of the first player because it's 0", () => {
      skyjo.start()
      skyjo.firstToFinishPlayerId = player.id
      skyjo.roundStatus = ROUND_STATUS.LAST_LAP
      player.hasPlayedLastTurn = true
      skyjo.turn = 1

      player.cards = [
        [
          new SkyjoCard(0, true),
          new SkyjoCard(-2, true),
          new SkyjoCard(2, true),
        ],
      ]
      opponent.cards = [
        [
          new SkyjoCard(-2, true),
          new SkyjoCard(-2, true),
          new SkyjoCard(-1, true),
        ],
      ]

      skyjo.nextTurn()

      expect(skyjo.roundStatus).toBe<RoundStatus>(ROUND_STATUS.OVER)
      expect(skyjo.status).toBe<GameStatus>(GAME_STATUS.PLAYING)
      expect(player.score).toBe(0 + -2 + 2)
    })

    it("should set next turn, end the round and not double score of the first player because it's negative", () => {
      skyjo.start()
      skyjo.firstToFinishPlayerId = player.id
      skyjo.roundStatus = ROUND_STATUS.LAST_LAP
      player.hasPlayedLastTurn = true
      skyjo.turn = 1

      player.cards = [
        [
          new SkyjoCard(0, true),
          new SkyjoCard(0, true),
          new SkyjoCard(-2, true),
        ],
      ]
      opponent.cards = [
        [
          new SkyjoCard(-2, true),
          new SkyjoCard(-2, true),
          new SkyjoCard(-1, true),
        ],
      ]

      skyjo.nextTurn()

      expect(skyjo.roundStatus).toBe<RoundStatus>(ROUND_STATUS.OVER)
      expect(skyjo.status).toBe<GameStatus>(GAME_STATUS.PLAYING)
      expect(player.score).toBe(0 + 0 + -2)
    })

    it("should set next turn, end the round, double score of the first player and end the game", () => {
      skyjo.start()
      skyjo.roundNumber = 2
      skyjo.firstToFinishPlayerId = player.id
      skyjo.roundStatus = ROUND_STATUS.LAST_LAP
      player.hasPlayedLastTurn = true
      skyjo.turn = 1

      player.scores = [90]
      player.cards = [
        [
          new SkyjoCard(1, true),
          new SkyjoCard(1, true),
          new SkyjoCard(3, true),
        ],
      ]

      opponent.scores = [45]
      opponent.cards = [
        [
          new SkyjoCard(1, true),
          new SkyjoCard(1, true),
          new SkyjoCard(2, true),
        ],
      ]

      skyjo.nextTurn()

      expect(skyjo.roundStatus).toBe<RoundStatus>(ROUND_STATUS.OVER)
      expect(skyjo.status).toBe<GameStatus>(GAME_STATUS.FINISHED)
      expect(player.score).toBe(90 + (1 + 1 + 3) * 2)
    })
  })

  describe("start new round", () => {
    it("should start a new round and wait for players to turn initial cards if there is a card to turn at the beginning of the game", () => {
      skyjo.roundNumber = 1
      skyjo.firstToFinishPlayerId = player.id
      skyjo.selectedCardValue = 1
      skyjo.lastTurnStatus = LAST_TURN_STATUS.PICK_FROM_DRAW_PILE
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
      expect(skyjo.lastTurnStatus).toBe<LastTurnStatus>(LAST_TURN_STATUS.TURN)
      skyjo.players.forEach((player) => {
        expect(player.cards.flat()).toHaveLength(CARDS_PER_PLAYER)
        expect(player.hasRevealedCardCount(0)).toBeTruthy()
      })
      expect(skyjo.roundStatus).toBe<RoundStatus>(
        ROUND_STATUS.WAITING_PLAYERS_TO_TURN_INITIAL_CARDS,
      )
      expect(skyjo.turnStatus).toBe<TurnStatus>(TURN_STATUS.CHOOSE_A_PILE)
    })

    it("should start a new round and not wait for players to turn initial cards if there is no card to turn at the beginning of the game", () => {
      skyjo.settings.initialTurnedCount = 0
      skyjo.roundNumber = 1
      skyjo.firstToFinishPlayerId = player.id
      skyjo.selectedCardValue = 1
      skyjo.lastTurnStatus = LAST_TURN_STATUS.PICK_FROM_DRAW_PILE
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
      expect(skyjo.lastTurnStatus).toBe<LastTurnStatus>(LAST_TURN_STATUS.TURN)
      skyjo.players.forEach((player) => {
        expect(player.cards.flat()).toHaveLength(CARDS_PER_PLAYER)
        expect(player.hasRevealedCardCount(0)).toBeTruthy()
      })
      expect(skyjo.roundStatus).toBe<RoundStatus>(ROUND_STATUS.PLAYING)
      expect(skyjo.turnStatus).toBe<TurnStatus>(TURN_STATUS.CHOOSE_A_PILE)
    })
  })

  describe("Restart the game if all players want to replay", () => {
    it("shouldn't restart the game", () => {
      skyjo.status = GAME_STATUS.FINISHED
      player.wantsReplay = false
      opponent.wantsReplay = true

      skyjo.restartGameIfAllPlayersWantReplay()

      expect(skyjo.status).toBe<GameStatus>(GAME_STATUS.FINISHED)
    })

    it("should restart the game", () => {
      skyjo.status = GAME_STATUS.FINISHED
      skyjo.players.forEach((player) => {
        player.wantsReplay = true
      })

      skyjo.restartGameIfAllPlayersWantReplay()

      expect(skyjo.status).toBe<GameStatus>(GAME_STATUS.LOBBY)
    })
  })

  it("should reset the game", () => {
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

  it("should return json", () => {
    const gameToJson = skyjo.toJson()

    expect(gameToJson).toStrictEqual({
      code: skyjo.code,
      status: GAME_STATUS.LOBBY,
      roundStatus: ROUND_STATUS.WAITING_PLAYERS_TO_TURN_INITIAL_CARDS,
      adminId: player.id,
      players: skyjo.players.map((player) => player.toJson(skyjo.adminId)),
      selectedCardValue: null,
      lastDiscardCardValue: skyjo["discardPile"][["_discardPile"].length - 1],
      lastTurnStatus: LAST_TURN_STATUS.TURN,
      turn: 0,
      turnStatus: TURN_STATUS.CHOOSE_A_PILE,
      settings: skyjo.settings.toJson(),
      updatedAt: skyjo.updatedAt,
    })
  })
})
