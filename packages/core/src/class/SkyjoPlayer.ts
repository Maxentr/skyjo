import type { SkyjoToDb } from "@/types/skyjo.js"
import type {
  SkyjoPlayerScores,
  SkyjoPlayerToJson,
} from "@/types/skyjoPlayer.js"
import type { CreatePlayer } from "@/validations/player.js"
import { type Avatar, type ConnectionStatus, Constants } from "../constants.js"
import { SkyjoCard } from "./SkyjoCard.js"
import { SkyjoSettings } from "./SkyjoSettings.js"

interface SkyjoPlayerInterface {
  cards: SkyjoCard[][]
  scores: SkyjoPlayerScores
  readonly name: string
  readonly socketId: string
  readonly avatar: Avatar
  connectionStatus: ConnectionStatus
  score: number
  wantsReplay: boolean
  hasPlayedLastTurn: boolean

  toggleReplay(): void
  setCards(cardsValue: number[], cardSettings: SkyjoSettings): void
  turnCard(column: number, row: number): void
  replaceCard(column: number, row: number, value: number): void
  hasRevealedCardCount(count: number): boolean
  checkColumnsAndDiscard(): SkyjoCard[]
  checkRowsAndDiscard(): SkyjoCard[]
  currentScoreArray(): number[]
  turnAllCards(): void
  recalculateScore(): void
  finalRoundScore(): void
  toJson(): SkyjoPlayerToJson
}
export class SkyjoPlayer implements SkyjoPlayerInterface {
  id: string = crypto.randomUUID()
  name: string
  socketId: string
  avatar: Avatar = Constants.AVATARS.BEE
  connectionStatus: ConnectionStatus = Constants.CONNECTION_STATUS.CONNECTED
  cards: SkyjoCard[][] = []
  score: number = 0
  scores: SkyjoPlayerScores = []
  hasPlayedLastTurn = false
  wantsReplay: boolean = false

  constructor(
    playerToCreate: CreatePlayer = {
      username: "",
      avatar: Constants.AVATARS.BEE,
    },
    socketId: string = "",
  ) {
    this.name = playerToCreate.username
    this.socketId = socketId
    this.avatar = playerToCreate.avatar
  }

  populate(player: SkyjoToDb["players"][number]) {
    this.id = player.id
    this.name = player.name
    this.avatar = player.avatar
    this.socketId = player.socketId
    this.connectionStatus = player.connectionStatus
    this.score = player.score
    this.scores = player.scores
    this.wantsReplay = player.wantsReplay
    this.hasPlayedLastTurn = player.hasPlayedLastTurn

    if (player.cards.length > 0) {
      this.cards = player.cards.map((column) =>
        column.map(
          (card) => new SkyjoCard(card.value, card.isVisible, card.id),
        ),
      )
    }

    return this
  }

  toggleReplay() {
    this.wantsReplay = !this.wantsReplay
  }

  setCards(cardsValue: number[], cardSettings: SkyjoSettings) {
    this.cards = []

    for (let columnI = 0; columnI < cardSettings.cardPerColumn; columnI++) {
      this.cards.push([])
      for (let rowJ = 0; rowJ < cardSettings.cardPerRow; rowJ++) {
        const index = columnI * cardSettings.cardPerRow + rowJ
        this.cards[columnI].push(new SkyjoCard(cardsValue[index]))
      }
    }
  }

  turnCard(column: number, row: number) {
    this.cards[column][row].turnVisible()
  }

  replaceCard(column: number, row: number, value: number) {
    const card = this.cards[column][row]

    card.turnVisible()
    card.value = value
  }

  hasRevealedCardCount(count: number) {
    const currentCount = this.cards
      .flat()
      .filter((card) => card.isVisible).length

    return currentCount === count
  }

  checkColumnsAndDiscard() {
    if (!this.cards[0] || this.cards[0].length <= 1) return []

    const cardsToDiscard: SkyjoCard[] = []
    this.cards.forEach((column, index) => {
      const allCardsAreTheSameAndVisible = column.every(
        (card) => card.value === column[0].value && card.isVisible,
      )

      if (allCardsAreTheSameAndVisible) {
        cardsToDiscard.push(...this.removeColumn(index))
      }
    })

    return cardsToDiscard
  }

  checkRowsAndDiscard() {
    if (this.cards.length <= 1) return []

    const cardsToDiscard: SkyjoCard[] = []

    for (let rowIndex = 0; rowIndex < this.cards[0].length; rowIndex++) {
      const row = this.cards
        .map((column) => column.slice(rowIndex, rowIndex + 1))
        .flat()

      const allCardsAreTheSameAndVisible = row.every(
        (card) => card.value === row[0].value && card.isVisible,
      )

      if (allCardsAreTheSameAndVisible) {
        cardsToDiscard.push(...this.removeRow(rowIndex))
      }
    }

    return cardsToDiscard
  }

  currentScoreArray() {
    const currentScore: number[] = []

    this.cards.flat().forEach((card) => {
      if (card.isVisible) currentScore.push(card.value)
    })

    return currentScore
  }

  turnAllCards() {
    this.cards.forEach((column) => {
      column.forEach((card) => {
        card.turnVisible()
      })
    })
  }

  recalculateScore() {
    this.score = (
      this.scores.filter((score) => Number.isInteger(score)) as number[]
    ).reduce((a, b) => +a + +b, 0)
  }

  finalRoundScore() {
    let finalScore = 0

    if (this.connectionStatus === Constants.CONNECTION_STATUS.DISCONNECTED) {
      this.scores.push("-")
      return
    }

    this.cards.forEach((column) => {
      column.forEach((card) => {
        finalScore += card.value
      })
    })

    this.scores.push(finalScore)

    this.recalculateScore()
  }

  reset() {
    this.cards = []
    this.hasPlayedLastTurn = false
    this.wantsReplay = false
    this.scores = []
    this.score = 0
  }

  resetRound() {
    this.cards = []
    this.hasPlayedLastTurn = false
  }

  toJson() {
    return {
      id: this.id,
      name: this.name,
      socketId: this.socketId,
      avatar: this.avatar,
      score: this.score,
      wantsReplay: this.wantsReplay,
      connectionStatus: this.connectionStatus,
      scores: this.scores,
      cards: this.cards.map((column) => column.map((card) => card.toJson())),
    } satisfies SkyjoPlayerToJson
  }

  //#region private methods
  private removeColumn(column: number) {
    const deletedColumn = this.cards.splice(column, 1)
    return deletedColumn[0]
  }

  private removeRow(row: number) {
    const deletedRow = this.cards.map((column) => column.splice(row, 1))
    return deletedRow.flat()
  }

  currentScore() {
    return this.currentScoreArray().reduce((a, b) => a + b, 0)
  }

  //#endregion
}
