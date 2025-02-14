import type { SkyjoDbFormat, SkyjoToJson } from "@/types/skyjo.js"
import { CError, Constants as ErrorConstants } from "@skyjo/error"
import {
  Constants,
  type GameStatus,
  type LastTurnStatus,
  type RoundPhase,
  type TurnStatus,
} from "../constants.js"
import { SkyjoCard } from "./SkyjoCard.js"
import { SkyjoPlayer } from "./SkyjoPlayer.js"
import { SkyjoSettings } from "./SkyjoSettings.js"

interface SkyjoInterface {
  id: string
  code: string
  status: GameStatus
  players: SkyjoPlayer[]
  turn: number
  adminId: string
  settings: SkyjoSettings

  selectedCardValue: number | null
  firstToFinishPlayerId: string | null
  turnStatus: TurnStatus
  lastTurnStatus: LastTurnStatus
  roundPhase: RoundPhase

  stateVersion: number
  createdAt: Date
  updatedAt: Date
}

export class Skyjo implements SkyjoInterface {
  id: string = crypto.randomUUID()
  code: string = Math.random().toString(36).substring(2, 10)
  adminId: string
  settings: SkyjoSettings
  status: GameStatus = Constants.GAME_STATUS.LOBBY
  players: SkyjoPlayer[] = []
  turn: number = 0
  discardPile: number[] = []
  drawPile: number[] = []

  selectedCardValue: number | null = null
  turnStatus: TurnStatus = Constants.TURN_STATUS.CHOOSE_A_PILE
  lastTurnStatus: LastTurnStatus = Constants.LAST_TURN_STATUS.TURN
  roundPhase: RoundPhase = Constants.ROUND_PHASE.TURN_CARDS
  roundNumber: number = 1
  firstToFinishPlayerId: string | null = null

  createdAt: Date
  updatedAt: Date
  stateVersion: number = 0

  constructor(
    adminPlayerId: string,
    settings: SkyjoSettings = new SkyjoSettings(),
  ) {
    this.adminId = adminPlayerId
    this.settings = settings

    const now = new Date()
    this.createdAt = now
    this.updatedAt = now
  }

  populate(game: SkyjoDbFormat) {
    this.id = game.id
    this.code = game.code
    this.status = game.status
    this.turn = game.turn
    this.discardPile = game.discardPile
    this.drawPile = game.drawPile

    this.selectedCardValue = game.selectedCardValue
    this.turnStatus = game.turnStatus
    this.lastTurnStatus = game.lastTurnStatus
    this.roundPhase = game.roundPhase
    this.roundNumber = game.roundNumber

    this.firstToFinishPlayerId = game.firstToFinishPlayerId

    this.stateVersion = game.stateVersion
    this.createdAt = game.createdAt
    this.updatedAt = game.updatedAt

    this.players = game.players.map((player) =>
      new SkyjoPlayer().populate(player),
    )

    this.settings.populate(game.settings)

    return this
  }

  getConnectedPlayers(playerIdsToExclude: string[] = []) {
    return this.players.filter(
      (player) =>
        player.connectionStatus !== Constants.CONNECTION_STATUS.DISCONNECTED &&
        !playerIdsToExclude?.includes(player.id),
    )
  }

  getCurrentPlayer() {
    return this.players[this.turn]
  }

  getPlayerById(playerId: string) {
    return this.players.find((player) => {
      return player.id === playerId
    })
  }

  addPlayer(player: SkyjoPlayer) {
    if (this.isFull()) {
      throw new CError("Cannot add player, game is full", {
        code: ErrorConstants.ERROR.GAME_IS_FULL,
        level: "warn",
        meta: {
          game: this,
          player,
          gameCode: this.code,
          playerId: player.id,
        },
      })
    }

    this.players.push(player)
  }

  removePlayer(playerId: string) {
    this.players = this.players.filter((player) => player.id !== playerId)
  }

  isAdmin(playerId: string) {
    return this.adminId === playerId
  }

  changeAdmin() {
    const players = this.getConnectedPlayers([this.adminId])
    if (players.length === 0) return

    this.adminId = players[0].id
  }

  isFull() {
    return this.getConnectedPlayers().length >= this.settings.maxPlayers
  }

  //#region status
  /* istanbul ignore else --@preserve */
  isInLobby() {
    return this.status === Constants.GAME_STATUS.LOBBY
  }
  /* istanbul ignore else --@preserve */
  isPlaying() {
    return this.status === Constants.GAME_STATUS.PLAYING
  }
  /* istanbul ignore else --@preserve */
  isFinished() {
    return this.status === Constants.GAME_STATUS.FINISHED
  }
  /* istanbul ignore else --@preserve */
  isStopped() {
    return this.status === Constants.GAME_STATUS.STOPPED
  }
  //#endregion

  //#region roundPhase
  isRoundTurningCards() {
    return this.roundPhase === Constants.ROUND_PHASE.TURN_CARDS
  }

  isRoundInMain() {
    return this.roundPhase === Constants.ROUND_PHASE.MAIN
  }

  isRoundInLastLap() {
    return this.roundPhase === Constants.ROUND_PHASE.LAST_LAP
  }

  isRoundOver() {
    return this.roundPhase === Constants.ROUND_PHASE.OVER
  }
  //#endregion

  checkTurn(playerId: string) {
    return this.players[this.turn].id === playerId
  }

  hasMinPlayersConnected() {
    return (
      this.getConnectedPlayers().length >=
      Constants.DEFAULT_GAME_SETTINGS.MIN_PLAYERS
    )
  }

  start() {
    if (
      this.getConnectedPlayers().length <
      Constants.DEFAULT_GAME_SETTINGS.MIN_PLAYERS
    ) {
      throw new CError(
        `Game cannot start with less than ${Constants.DEFAULT_GAME_SETTINGS.MIN_PLAYERS} players`,
        {
          code: ErrorConstants.ERROR.TOO_FEW_PLAYERS,
          level: "warn",
          meta: {
            game: this,
          },
        },
      )
    }

    this.resetRound()
    this.lastTurnStatus = Constants.LAST_TURN_STATUS.TURN
    if (this.settings.initialTurnedCount === 0)
      this.roundPhase = Constants.ROUND_PHASE.MAIN

    this.status = Constants.GAME_STATUS.PLAYING
    this.turn = Math.floor(Math.random() * this.players.length)
  }

  haveAllPlayersRevealedCards() {
    return this.getConnectedPlayers().every((player) =>
      player.hasRevealedCardCount(this.settings.initialTurnedCount),
    )
  }

  startRoundAfterInitialReveal() {
    this.roundPhase = Constants.ROUND_PHASE.MAIN
    this.setFirstPlayerToStart()
  }

  drawCard() {
    if (this.drawPile.length === 0) this.reloadDrawPile()

    const cardValue = this.drawPile.shift()!
    this.selectedCardValue = cardValue

    this.turnStatus = Constants.TURN_STATUS.THROW_OR_REPLACE
    this.lastTurnStatus = Constants.LAST_TURN_STATUS.PICK_FROM_DRAW_PILE
  }

  pickFromDiscard() {
    if (this.discardPile.length === 0) return
    const cardValue = this.discardPile.pop()!
    this.selectedCardValue = cardValue

    this.turnStatus = Constants.TURN_STATUS.REPLACE_A_CARD
    this.lastTurnStatus = Constants.LAST_TURN_STATUS.PICK_FROM_DISCARD_PILE
  }

  discardCard(value: number) {
    this.discardPile.push(value)
    this.selectedCardValue = null

    this.turnStatus = Constants.TURN_STATUS.TURN_A_CARD
    this.lastTurnStatus = Constants.LAST_TURN_STATUS.THROW
  }

  replaceCard(column: number, row: number) {
    const player = this.getCurrentPlayer()
    const oldCardValue = player.cards[column][row].value
    player.replaceCard(column, row, this.selectedCardValue!)
    this.selectedCardValue = null
    this.discardCard(oldCardValue)
    this.lastTurnStatus = Constants.LAST_TURN_STATUS.REPLACE
  }

  turnCard(player: SkyjoPlayer, column: number, row: number) {
    player.turnCard(column, row)
    this.lastTurnStatus = Constants.LAST_TURN_STATUS.TURN
  }

  getLastDiscardCardValue() {
    return this.discardPile[this.discardPile.length - 1]
  }

  nextTurn() {
    const currentPlayer = this.getCurrentPlayer()

    this.checkCardsToDiscard(currentPlayer)

    this.checkAndSetFirstPlayerToFinish(currentPlayer)

    if (this.roundPhase === Constants.ROUND_PHASE.LAST_LAP) {
      currentPlayer.hasPlayedLastTurn = true
      this.lastTurnStatus = Constants.LAST_TURN_STATUS.TURN
      currentPlayer.turnAllCards()

      this.checkEndOfRound()
    }

    this.turnStatus = Constants.TURN_STATUS.CHOOSE_A_PILE
    this.turn = this.getNextTurn()
  }

  checkEndOfRound() {
    const allPlayersHavePlayedLastTurn = this.getConnectedPlayers().every(
      (player) => player.hasPlayedLastTurn,
    )

    if (allPlayersHavePlayedLastTurn) this.endRound()
  }

  endRound() {
    this.players.forEach((player) => {
      player.turnAllCards()
      this.checkCardsToDiscard(player)
      player.finalRoundScore()
    })

    this.checkFirstPlayerPenalty()

    this.roundPhase = Constants.ROUND_PHASE.OVER

    this.checkEndOfGame()
  }

  shouldRestartRound() {
    return this.roundPhase === Constants.ROUND_PHASE.OVER && !this.isFinished()
  }

  startNewRound() {
    this.roundNumber++
    this.initializeRound()
  }

  restartGameIfAllPlayersWantReplay() {
    if (this.getConnectedPlayers().every((player) => player.wantsReplay)) {
      this.resetRound()
      this.status = Constants.GAME_STATUS.LOBBY
      this.stateVersion = 0
      this.updatedAt = new Date()
      this.turn = 0

      // allow admin to change settings again
      this.settings.isConfirmed = false
    }
  }

  resetRound() {
    this.roundNumber = 1
    this.resetPlayers()
    this.initializeRound()
  }

  toJson() {
    return {
      code: this.code,
      adminId: this.adminId,
      status: this.status,
      players: this.players.map((player) => player.toJson()),
      turn: this.turn,
      lastDiscardCardValue: this.discardPile[this.discardPile.length - 1],
      selectedCardValue: this.selectedCardValue,
      roundPhase: this.roundPhase,
      turnStatus: this.turnStatus,
      lastTurnStatus: this.lastTurnStatus,
      settings: this.settings.toJson(),
      stateVersion: this.stateVersion,
      updatedAt: this.updatedAt,
    } satisfies SkyjoToJson
  }

  serializeGame() {
    return {
      id: this.id,
      code: this.code,
      adminId: this.adminId,
      isFull: this.isFull(),
      status: this.status,
      players: this.players.map((player) => ({
        id: player.id,
        name: player.name,
        socketId: player.socketId,
        avatar: player.avatar,
        score: player.score,
        wantsReplay: player.wantsReplay,
        connectionStatus: player.connectionStatus,
        scores: player.scores,
        hasPlayedLastTurn: player.hasPlayedLastTurn,
        cards: player.cards.map((column) =>
          column.map((card) => ({
            id: card.id,
            value: card.value,
            isVisible: card.isVisible,
          })),
        ),
      })),
      turn: this.turn,
      discardPile: this.discardPile,
      drawPile: this.drawPile,
      settings: {
        isConfirmed: this.settings.isConfirmed,
        private: this.settings.private,
        maxPlayers: this.settings.maxPlayers,
        allowSkyjoForColumn: this.settings.allowSkyjoForColumn,
        allowSkyjoForRow: this.settings.allowSkyjoForRow,
        initialTurnedCount: this.settings.initialTurnedCount,
        cardPerRow: this.settings.cardPerRow,
        cardPerColumn: this.settings.cardPerColumn,
        scoreToEndGame: this.settings.scoreToEndGame,
        firstPlayerMultiplierPenalty:
          this.settings.firstPlayerMultiplierPenalty,
        firstPlayerPenaltyType: this.settings.firstPlayerPenaltyType,
        firstPlayerFlatPenalty: this.settings.firstPlayerFlatPenalty,
      },
      selectedCardValue: this.selectedCardValue,
      roundNumber: this.roundNumber,
      roundPhase: this.roundPhase,
      turnStatus: this.turnStatus,
      lastTurnStatus: this.lastTurnStatus,
      firstToFinishPlayerId: this.firstToFinishPlayerId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      stateVersion: this.stateVersion,
    } satisfies SkyjoDbFormat
  }

  //#region private methods

  private initializeCardPiles() {
    const defaultCards = [
      ...Array(5).fill(-2),
      ...Array(10).fill(-1),
      ...Array(15).fill(0),
      ...Array(10).fill(1),
      ...Array(10).fill(2),
      ...Array(10).fill(3),
      ...Array(10).fill(4),
      ...Array(10).fill(5),
      ...Array(10).fill(6),
      ...Array(10).fill(7),
      ...Array(10).fill(8),
      ...Array(10).fill(9),
      ...Array(10).fill(10),
      ...Array(10).fill(11),
      ...Array(10).fill(12),
    ]

    this.drawPile = this.shufflePile(defaultCards)
    this.discardPile = []
  }

  private resetRoundPlayers() {
    this.getConnectedPlayers().forEach((player) => {
      player.resetRound()
    })
  }

  private givePlayersCards() {
    this.getConnectedPlayers().forEach((player) => {
      const cards = this.drawPile.splice(0, 12)
      player.setCards(cards, this.settings)
    })
  }

  private initializeRound() {
    this.firstToFinishPlayerId = null
    this.selectedCardValue = null
    this.lastTurnStatus = Constants.LAST_TURN_STATUS.TURN
    this.initializeCardPiles()
    this.resetRoundPlayers()

    // Give to each player 12 cards
    this.givePlayersCards()

    // Turn first card from faceoff pile to discard pile
    this.discardPile.push(this.drawPile.shift()!)

    this.turnStatus = Constants.TURN_STATUS.CHOOSE_A_PILE

    if (this.settings.initialTurnedCount === 0)
      this.roundPhase = Constants.ROUND_PHASE.MAIN
    else this.roundPhase = Constants.ROUND_PHASE.TURN_CARDS
  }

  private reloadDrawPile() {
    const lastCardOfDiscardPile = this.discardPile.pop()!
    this.drawPile = this.shufflePile(this.discardPile)
    this.discardPile = [lastCardOfDiscardPile]
  }

  private setFirstPlayerToStart() {
    const playersScore = this.players.map((player, i) => {
      if (player.connectionStatus === Constants.CONNECTION_STATUS.DISCONNECTED)
        return undefined

      const arrayScore = player.currentScoreArray()

      return {
        arrayScore,
        index: i,
      }
    })

    // the player with the highest score will start. If there is a tie, the player who have the highest card will start
    const playerToStart = playersScore.reduce((a, b) => {
      if (!a) return b
      if (!b) return a

      const aSum = a.arrayScore.reduce((acc, cur) => acc + cur, 0)
      const bSum = b.arrayScore.reduce((acc, cur) => acc + cur, 0)

      if (aSum === bSum) {
        const aMax = Math.max(...a.arrayScore)
        const bMax = Math.max(...b.arrayScore)

        // if the max value is the same, we randomize the result
        if (aMax === bMax) {
          const random = Math.floor(Math.random() * 2)
          return random === 0 ? a : b
        }

        return aMax > bMax ? a : b
      }

      return aSum > bSum ? a : b
    }, playersScore[0])

    this.turn = playerToStart!.index
  }

  private checkCardsToDiscard(player: SkyjoPlayer) {
    let cardsToDiscard: SkyjoCard[] = []

    if (this.settings.allowSkyjoForColumn) {
      cardsToDiscard = player.checkColumnsAndDiscard()
    }
    if (this.settings.allowSkyjoForRow) {
      cardsToDiscard = cardsToDiscard.concat(player.checkRowsAndDiscard())
    }

    if (cardsToDiscard.length > 0) {
      cardsToDiscard.forEach((card) => this.discardCard(card.value))

      if (this.settings.allowSkyjoForColumn && this.settings.allowSkyjoForRow)
        this.checkCardsToDiscard(player)
    }
  }

  private checkAndSetFirstPlayerToFinish(player: SkyjoPlayer) {
    // check if the player has turned all his cards
    const hasPlayerFinished = player.hasRevealedCardCount(
      player.cards.flat().length,
    )

    if (hasPlayerFinished && !this.firstToFinishPlayerId) {
      this.firstToFinishPlayerId = player.id
      this.roundPhase = Constants.ROUND_PHASE.LAST_LAP
    }
  }

  private getNextTurn() {
    let nextTurn = (this.turn + 1) % this.players.length

    while (
      this.players[nextTurn].connectionStatus ===
      Constants.CONNECTION_STATUS.DISCONNECTED
    ) {
      nextTurn = (nextTurn + 1) % this.players.length
    }

    return nextTurn
  }

  private removeDisconnectedPlayers() {
    this.players = this.getConnectedPlayers()
  }

  private resetPlayers() {
    this.removeDisconnectedPlayers()

    this.getConnectedPlayers().forEach((player) => player.reset())
  }

  private checkFirstPlayerPenalty() {
    const lastScoreIndex = this.roundNumber - 1
    const firstToFinishPlayer = this.players.find(
      (player) => player.id === this.firstToFinishPlayerId,
    )
    if (!firstToFinishPlayer) return

    const firstToFinishPlayerScore = firstToFinishPlayer.scores[lastScoreIndex]

    if (typeof firstToFinishPlayerScore === "string") return

    const otherPlayersHaveLowerScore = this.getConnectedPlayers().some(
      (player) => {
        if (player.id === this.firstToFinishPlayerId) return false
        return (
          player.scores[lastScoreIndex] !== "-" &&
          player.scores[lastScoreIndex] <= firstToFinishPlayerScore
        )
      },
    )

    if (!otherPlayersHaveLowerScore) return

    let finalScore = firstToFinishPlayerScore

    switch (this.settings.firstPlayerPenaltyType) {
      case Constants.FIRST_PLAYER_PENALTY_TYPE.MULTIPLIER_ONLY:
        finalScore = this.multiplierPenalty(finalScore)
        break
      case Constants.FIRST_PLAYER_PENALTY_TYPE.FLAT_ONLY:
        finalScore = this.flatPenalty(finalScore)
        break
      case Constants.FIRST_PLAYER_PENALTY_TYPE.FLAT_THEN_MULTIPLIER:
        finalScore = this.flatPenalty(finalScore)
        finalScore = this.multiplierPenalty(finalScore)
        break
      case Constants.FIRST_PLAYER_PENALTY_TYPE.MULTIPLIER_THEN_FLAT:
        finalScore = this.multiplierPenalty(finalScore)
        finalScore = this.flatPenalty(finalScore)
        break
    }

    firstToFinishPlayer.scores[lastScoreIndex] = finalScore
    firstToFinishPlayer.recalculateScore()
  }

  private multiplierPenalty(score: number) {
    const isScorePositive = score > 0
    if (!isScorePositive) return score

    return score * this.settings.firstPlayerMultiplierPenalty
  }

  private flatPenalty(score: number) {
    return score + this.settings.firstPlayerFlatPenalty
  }

  private checkEndOfGame() {
    if (
      this.getConnectedPlayers().some(
        (player) => player.score >= this.settings.scoreToEndGame,
      )
    ) {
      this.roundPhase = Constants.ROUND_PHASE.OVER
      this.status = Constants.GAME_STATUS.FINISHED
    }
  }

  private shufflePile(pile: number[], times = 3): number[] {
    const shuffledArray = [...pile]

    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffledArray[i], shuffledArray[j]] = [
        shuffledArray[j],
        shuffledArray[i],
      ]
    }

    return times > 0
      ? this.shufflePile(shuffledArray, times - 1)
      : shuffledArray
  }

  //#endregion
}
