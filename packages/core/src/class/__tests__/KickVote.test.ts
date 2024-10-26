import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  RANDOM_SOCKET_ID,
  TEST_SOCKET_ID,
} from "../../../tests/constants-test.js"
import { Constants as CoreConstants } from "../../constants.js"
import { KickVote } from "../KickVote"
import { Skyjo } from "../Skyjo.js"
import { SkyjoPlayer } from "../SkyjoPlayer.js"
import { SkyjoSettings } from "../SkyjoSettings.js"

describe("KickVote", () => {
  let game: Skyjo
  let player: SkyjoPlayer
  let opponent1: SkyjoPlayer
  let opponent2: SkyjoPlayer

  beforeEach(() => {
    player = new SkyjoPlayer(
      { username: "player1", avatar: CoreConstants.AVATARS.BEE },
      TEST_SOCKET_ID,
    )
    game = new Skyjo(player.id, new SkyjoSettings())
    game.addPlayer(player)

    opponent1 = new SkyjoPlayer(
      { username: "opponent1", avatar: CoreConstants.AVATARS.BEE },
      TEST_SOCKET_ID,
    )
    game.addPlayer(opponent1)

    opponent2 = new SkyjoPlayer(
      { username: "opponent2", avatar: CoreConstants.AVATARS.BEE },
      TEST_SOCKET_ID,
    )
    game.addPlayer(opponent2)
  })

  it("should create a kick vote", () => {
    const vote = new KickVote(game, opponent1.id, player.id)

    expect(vote.initiatorId).toBe(player.id)
  })

  describe("addVote", () => {
    it("should add a vote", () => {
      const vote = new KickVote(game, opponent1.id, player.id)

      vote.addVote(opponent2.id, true)

      expect(vote["votes"].length).toBe(2)
    })
  })

  describe("hasPlayerVoted", () => {
    it("should check if the player has voted and return false if not", () => {
      const vote = new KickVote(game, opponent1.id, player.id)

      expect(vote.hasPlayerVoted(opponent2.id)).toBeFalsy()
    })

    it("should check if the player has voted and return true if yes", () => {
      const vote = new KickVote(game, opponent1.id, player.id)

      vote.addVote(opponent2.id, true)

      expect(vote.hasPlayerVoted(opponent2.id)).toBeTruthy()
    })
  })

  describe("getRequiredVotes", () => {
    it("should return the required votes", () => {
      const vote = new KickVote(game, opponent1.id, player.id)

      expect(vote.getRequiredVotes()).toBe(2)
    })

    it("should return the required votes for a game with 3 players", () => {
      const vote = new KickVote(game, opponent1.id, player.id)

      const player3 = new SkyjoPlayer(
        { username: "player3", avatar: CoreConstants.AVATARS.BEE },
        RANDOM_SOCKET_ID(),
      )
      game.addPlayer(player3)

      expect(vote.getRequiredVotes()).toBe(3)
    })
  })

  describe("hasReachedRequiredVotes", () => {
    it("should check if the vote has reached the required votes and return false if not", () => {
      const vote = new KickVote(game, opponent1.id, player.id)

      expect(vote.hasReachedRequiredVotes()).toBeFalsy()
    })

    it("should check if the vote has reached the required votes and return true if yes", () => {
      const vote = new KickVote(game, opponent1.id, player.id)

      vote.addVote(opponent2.id, true)

      expect(vote.hasReachedRequiredVotes()).toBeTruthy()
    })
  })

  describe("allPlayersVotedExceptTarget", () => {
    it("should check if all players have voted except the target and return false if not", () => {
      const vote = new KickVote(game, opponent1.id, player.id)

      expect(vote.allPlayersVotedExceptTarget()).toBeFalsy()
    })

    it("should check if all players have voted except the target and return true if yes", () => {
      const vote = new KickVote(game, opponent1.id, player.id)

      vote.addVote(opponent2.id, true)

      expect(vote.allPlayersVotedExceptTarget()).toBeTruthy()
    })
  })

  describe("hasExpired", () => {
    it("should check if the vote has expired and return false if not", () => {
      const vote = new KickVote(game, opponent1.id, player.id)

      expect(vote.hasExpired()).toBeFalsy()
    })

    it("should check if the vote has expired and return true if yes", () => {
      vi.useFakeTimers()
      const vote = new KickVote(game, opponent1.id, player.id)

      // add 31 seconds
      vi.advanceTimersByTime(31000)

      expect(vote.hasExpired()).toBeTruthy()

      vi.useRealTimers()
    })
  })

  describe("toJson", () => {
    it("should return the vote in json format", () => {
      const vote = new KickVote(game, opponent1.id, player.id)

      const json = vote.toJson()

      expect(json).toEqual({
        targetId: vote["targetId"],
        initiatorId: vote["initiatorId"],
        votes: vote["votes"],
        requiredVotes: vote.getRequiredVotes(),
        expiresAt: vote["expiresAt"],
      })

      expect(json).not.toHaveProperty("game")
      expect(json).not.toHaveProperty("timeout")
    })
  })
})
