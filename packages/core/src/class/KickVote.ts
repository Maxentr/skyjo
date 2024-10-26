import type { KickVoteToJson, Vote } from "@/types/kickVote.js"
import { Constants } from "../constants.js"
import { Skyjo } from "./Skyjo.js"

interface KickVoteInterface {
  toJson(): KickVoteToJson
}

export class KickVote implements KickVoteInterface {
  timeout: NodeJS.Timeout | null = null

  readonly targetId: string
  readonly initiatorId: string

  private readonly game: Skyjo
  private readonly votes: Vote[]
  private readonly expiresAt: number =
    Date.now() + Constants.KICK_VOTE_EXPIRATION_TIME

  constructor(game: Skyjo, targetId: string, initiatorId: string) {
    this.game = game
    this.targetId = targetId
    this.initiatorId = initiatorId
    this.votes = [{ playerId: initiatorId, vote: true }]
  }

  addVote(playerId: string, vote: boolean) {
    this.votes.push({ playerId, vote })
  }

  hasPlayerVoted(playerId: string) {
    return this.votes.find((v) => v.playerId === playerId)
  }

  getRequiredVotes() {
    return Math.ceil(
      this.game.getConnectedPlayers().length * Constants.KICK_VOTE_THRESHOLD,
    )
  }

  hasReachedRequiredVotes() {
    const yesVotes = this.votes.filter((v) => v.vote).length

    return yesVotes >= this.getRequiredVotes()
  }

  allPlayersVotedExceptTarget() {
    return this.votes.length === this.game.getConnectedPlayers().length - 1
  }

  hasExpired() {
    return Date.now() > this.expiresAt
  }

  toJson(): KickVoteToJson {
    return {
      targetId: this.targetId,
      initiatorId: this.initiatorId,
      votes: this.votes,
      requiredVotes: this.getRequiredVotes(),
      expiresAt: this.expiresAt,
    }
  }
}
