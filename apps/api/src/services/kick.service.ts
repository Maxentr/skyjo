import type { SkyjoSocket } from "@/types/skyjoSocket.js"
import { Constants as CoreConstants, KickVote, type Skyjo } from "@skyjo/core"
import { CError, Constants as ErrorConstants } from "@skyjo/error"
import { BaseService } from "./base.service.js"

export class KickService extends BaseService {
  private readonly kickVotes: Map<string, KickVote> = new Map()

  async onInitiateKickVote(socket: SkyjoSocket, targetId: string) {
    const game = await this.getGame(socket.data.gameCode)
    await this.initiateKickVote(socket, game, targetId)
  }

  async onVoteToKick(socket: SkyjoSocket, vote: boolean) {
    const game = await this.getGame(socket.data.gameCode)

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

    this.broadcastKickVote(socket, game.code, "kick:vote", kickVote)
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
        await this.broadcastKickVote(
          socket,
          game.code,
          "kick:vote-failed",
          kickVote,
        )
      }
    } else {
      await this.broadcastKickVote(socket, game.code, "kick:vote", kickVote)
    }
  }

  private async kickPlayer(
    socket: SkyjoSocket,
    game: Skyjo,
    kickVote: KickVote,
  ) {
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
    await BaseService.playerDb.updatePlayer(playerToKick)

    if (game.isAdmin(playerToKick.id)) await this.changeAdmin(game)

    if (
      game.status === CoreConstants.GAME_STATUS.LOBBY ||
      game.status === CoreConstants.GAME_STATUS.FINISHED ||
      game.status === CoreConstants.GAME_STATUS.STOPPED
    ) {
      game.removePlayer(playerToKick.id)
      await BaseService.playerDb.removePlayer(game.id, playerToKick.id)
    }

    await this.broadcastKickVote(
      socket,
      game.code,
      "kick:vote-success",
      kickVote,
    )

    const updateGame = BaseService.gameDb.updateGame(game)
    const broadcast = this.broadcastGame(socket, game)

    await Promise.all([updateGame, broadcast])
  }

  private async broadcastKickVote(
    socket: SkyjoSocket,
    gameCode: string,
    event: "kick:vote" | "kick:vote-success" | "kick:vote-failed",
    kickVote: KickVote,
  ) {
    socket.to(gameCode).emit(event, kickVote.toJson())
    socket.emit(event, kickVote.toJson())
  }
  //#endregion
}
