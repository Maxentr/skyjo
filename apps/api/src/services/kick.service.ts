import type { SkyjoSocket } from "@/types/skyjoSocket.js"
import { GameStateManager } from "@/utils/GameStateManager.js"
import { Constants as CoreConstants, KickVote, type Skyjo } from "@skyjo/core"
import { CError, Constants as ErrorConstants } from "@skyjo/error"
import { BaseService } from "./base.service.js"

export class KickService extends BaseService {
  private readonly kickVotes: Map<string, KickVote> = new Map()

  async onInitiateKickVote(socket: SkyjoSocket, targetId: string) {
    const game = await this.redis.getGame(socket.data.gameCode)
    await this.initiateKickVote(socket, game, targetId)
  }

  async onVoteToKick(socket: SkyjoSocket, vote: boolean) {
    const game = await this.redis.getGame(socket.data.gameCode)

    const player = game.getPlayerById(socket.data.playerId)
    if (!player) {
      throw new CError(
        `Player try to vote to kick but is not found. This can happen if the player left the game before the vote ended.`,
        {
          code: ErrorConstants.ERROR.PLAYER_NOT_FOUND,
          level: "warn",
          meta: {
            game,
            socket,
            gameCode: game.code,
            playerId: socket.data.playerId,
          },
        },
      )
    }

    const kickVote = this.kickVotes.get(game.id)
    if (!kickVote) {
      throw new CError(
        `No kick vote is in progress. This can happen if the vote has expired or if the game is not in the correct state.`,
        {
          code: ErrorConstants.ERROR.NO_KICK_VOTE_IN_PROGRESS,
          level: "warn",
          meta: {
            game,
            socket,
            player,
            gameCode: game.code,
            playerId: socket.data.playerId,
          },
        },
      )
    }

    if (kickVote.hasPlayerVoted(player.id)) {
      throw new CError(`Player has already voted.`, {
        code: ErrorConstants.ERROR.PLAYER_ALREADY_VOTED,
        level: "warn",
        meta: {
          game,
          socket,
          player,
          gameCode: game.code,
          playerId: socket.data.playerId,
        },
      })
    }

    kickVote.addVote(player.id, vote)

    await this.checkKickVoteStatus(socket, game, kickVote)
  }

  //#region private methods
  private async initiateKickVote(
    socket: SkyjoSocket,
    game: Skyjo,
    targetId: string,
  ) {
    const initiator = game.getPlayerById(socket.data.playerId)
    if (!initiator) {
      throw new CError(
        `Player try to initiate a kick vote but is not found. This can happen if the player left the game before the vote started.`,
        {
          code: ErrorConstants.ERROR.PLAYER_NOT_FOUND,
          level: "warn",
          meta: {
            game,
            socket,
            gameCode: game.code,
            playerId: socket.data.playerId,
          },
        },
      )
    }

    const target = game.getPlayerById(targetId)
    if (!target) {
      throw new CError(
        `Player try to initiate a kick vote but targeted player is not found. This can happen if the player left the game before the vote started.`,
        {
          code: ErrorConstants.ERROR.PLAYER_NOT_FOUND,
          level: "warn",
          meta: {
            game,
            socket,
            initiator,
            targetId,
            gameCode: game.code,
            playerId: socket.data.playerId,
          },
        },
      )
    }

    if (this.kickVotes.has(game.id)) {
      throw new CError(
        `Cannot initiate a kick vote, a kick vote is already in progress for this game.`,
        {
          code: ErrorConstants.ERROR.KICK_VOTE_IN_PROGRESS,
          level: "warn",
          meta: {
            game,
            socket,
            initiator,
            target,
            gameCode: game.code,
            playerId: socket.data.playerId,
          },
        },
      )
    }

    const kickVote = new KickVote(game, target.id, initiator.id)

    this.kickVotes.set(game.id, kickVote)

    this.sendToSocketAndRoom(socket, {
      room: game.code,
      event: "kick:vote",
      data: [kickVote.toJson()],
    })

    await this.checkKickVoteStatus(socket, game, kickVote)

    // Add timeout for vote expiration
    kickVote.timeout = setTimeout(async () => {
      await this.checkKickVoteStatus(socket, game, kickVote)
    }, CoreConstants.KICK_VOTE_EXPIRATION_TIME)
  }

  private async checkKickVoteStatus(
    socket: SkyjoSocket,
    game: Skyjo,
    kickVote: KickVote,
  ) {
    if (
      kickVote.hasReachedRequiredVotes() ||
      kickVote.allPlayersVotedExceptTarget() ||
      kickVote.hasExpired()
    ) {
      /* istanbul ignore else --@preserve */
      if (kickVote.timeout) clearTimeout(kickVote.timeout)
      this.kickVotes.delete(game.id)

      if (kickVote.hasReachedRequiredVotes()) {
        await this.kickPlayer(socket, game, kickVote)
      } else {
        this.sendToSocketAndRoom(socket, {
          room: game.code,
          event: "kick:vote-failed",
          data: [kickVote.toJson()],
        })
      }
    } else {
      this.sendToSocketAndRoom(socket, {
        room: game.code,
        event: "kick:vote",
        data: [kickVote.toJson()],
      })
    }
  }

  private async kickPlayer(
    socket: SkyjoSocket,
    game: Skyjo,
    kickVote: KickVote,
  ) {
    const stateManager = new GameStateManager(game)

    const playerToKick = game.getPlayerById(kickVote.targetId)
    if (!playerToKick) {
      throw new CError(
        `Player try to be kicked but is not found in game. This can happen if the player left the game before the vote ended.`,
        {
          code: ErrorConstants.ERROR.PLAYER_NOT_FOUND,
          level: "warn",
          meta: {
            game,
            socket,
            targetId: kickVote.targetId,
            gameCode: game.code,
            playerId: socket.data.playerId,
          },
        },
      )
    }

    playerToKick.connectionStatus = CoreConstants.CONNECTION_STATUS.DISCONNECTED
    await this.redis.updatePlayer(game.code, playerToKick.toJson())

    if (game.isAdmin(playerToKick.id)) await this.changeAdmin(game)

    if (
      game.status === CoreConstants.GAME_STATUS.LOBBY ||
      game.status === CoreConstants.GAME_STATUS.FINISHED ||
      game.status === CoreConstants.GAME_STATUS.STOPPED
    ) {
      game.removePlayer(playerToKick.id)
      await this.redis.removePlayer(game.code, playerToKick.id)
    }

    this.sendToSocketAndRoom(socket, {
      room: game.code,
      event: "kick:vote-success",
      data: [kickVote.toJson()],
    })

    this.sendGameUpdateToSocketAndRoom(socket, {
      room: game.code,
      stateManager,
    })
    await this.redis.updateGame(game)
  }
  //#endregion
}
