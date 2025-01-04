import type { SkyjoSocket } from "@/socketio/types/skyjoSocket.js"
import { GameStateManager } from "@/socketio/utils/GameStateManager.js"
import {
  Constants as CoreConstants,
  type PlayPickCard,
  type PlayReplaceCard,
  type PlayRevealCard,
  type PlayTurnCard,
  type TurnStatus,
} from "@skyjo/core"
import { CError, Constants as ErrorConstants } from "@skyjo/error"
import { BaseService } from "./base.service.js"

export class GameService extends BaseService {
  async onGet(
    socket: SkyjoSocket,
    clientStateVersion: number | null,
    firstTime: boolean = false,
  ) {
    // TODO add trycatch and send error get if game not found to redirect the client to the homepage with a toast to explain the error
    // Leave the checkStateVersion check if client really needs to get the game
    await this.checkStateVersion(socket, clientStateVersion, firstTime)
  }

  async onRevealCard(
    socket: SkyjoSocket,
    turnData: PlayRevealCard,
    clientStateVersion: number,
  ) {
    await this.checkStateVersion(socket, clientStateVersion)

    const { column, row } = turnData
    const gameCode = socket.data.gameCode

    const game = await this.redis.getGame(gameCode)
    const stateManager = new GameStateManager(game)

    const player = game.getPlayerById(socket.data.playerId)
    if (!player) {
      throw new CError(`Player try to reveal a card but is not found.`, {
        code: ErrorConstants.ERROR.PLAYER_NOT_FOUND,
        meta: {
          game,
          socket,

          gameCode: game.code,
          playerId: socket.data.playerId,
        },
      })
    }

    if (
      !game.isPlaying() ||
      game.roundStatus !== CoreConstants.ROUND_STATUS.TURNING_INITIAL_CARDS
    ) {
      await this.sendGameToSocket(socket, game)
      throw new CError(
        `Player try to reveal a card but the game is not in the correct state. Sent game to the player to fix the issue.`,
        {
          code: ErrorConstants.ERROR.NOT_ALLOWED,
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

    if (player.hasRevealedCardCount(game.settings.initialTurnedCount)) return

    player.turnCard(column, row)

    if (game.haveAllPlayersRevealedCards()) game.startRoundAfterInitialReveal()

    this.sendGameUpdateToSocketAndRoom(socket, {
      room: game.code,
      stateManager,
    })
    await this.redis.updateGame(game)
  }

  async onPickCard(
    socket: SkyjoSocket,
    { pile }: PlayPickCard,
    clientStateVersion: number,
  ) {
    await this.checkStateVersion(socket, clientStateVersion)

    const { game } = await this.checkPlayAuthorization(socket, [
      CoreConstants.TURN_STATUS.CHOOSE_A_PILE,
    ])
    const stateManager = new GameStateManager(game)

    if (pile === "draw") game.drawCard()
    else game.pickFromDiscard()

    this.sendGameUpdateToSocketAndRoom(socket, {
      room: game.code,
      stateManager,
    })
    await this.redis.updateGame(game)
  }

  async onReplaceCard(
    socket: SkyjoSocket,
    { column, row }: PlayReplaceCard,
    clientStateVersion: number,
  ) {
    await this.checkStateVersion(socket, clientStateVersion)

    const { game } = await this.checkPlayAuthorization(socket, [
      CoreConstants.TURN_STATUS.REPLACE_A_CARD,
      CoreConstants.TURN_STATUS.THROW_OR_REPLACE,
    ])
    const stateManager = new GameStateManager(game)

    game.replaceCard(column, row)

    this.sendGameUpdateToSocketAndRoom(socket, {
      room: game.code,
      stateManager,
    })
    await this.redis.updateGame(game)

    await this.finishTurn(socket, game)
    this.sendGameUpdateToSocketAndRoom(socket, {
      room: game.code,
      stateManager,
    })
    await this.redis.updateGame(game)
  }

  async onDiscardCard(socket: SkyjoSocket, clientStateVersion: number) {
    await this.checkStateVersion(socket, clientStateVersion)

    const { game } = await this.checkPlayAuthorization(socket, [
      CoreConstants.TURN_STATUS.THROW_OR_REPLACE,
    ])
    const stateManager = new GameStateManager(game)

    game.discardCard(game.selectedCardValue!)

    this.sendGameUpdateToSocketAndRoom(socket, {
      room: game.code,
      stateManager,
    })
    await this.redis.updateGame(game)
  }

  async onTurnCard(
    socket: SkyjoSocket,
    { column, row }: PlayTurnCard,
    clientStateVersion: number,
  ) {
    await this.checkStateVersion(socket, clientStateVersion)

    const { game, player } = await this.checkPlayAuthorization(socket, [
      CoreConstants.TURN_STATUS.TURN_A_CARD,
    ])
    const stateManager = new GameStateManager(game)

    game.turnCard(player, column, row)

    this.sendGameUpdateToSocketAndRoom(socket, {
      room: game.code,
      stateManager,
    })
    await this.redis.updateGame(game)

    await this.finishTurn(socket, game)
    this.sendGameUpdateToSocketAndRoom(socket, {
      room: game.code,
      stateManager,
    })
    await this.redis.updateGame(game)
  }

  async onReplay(socket: SkyjoSocket, clientStateVersion: number) {
    await this.checkStateVersion(socket, clientStateVersion)

    const game = await this.redis.getGame(socket.data.gameCode)
    if (!game.isFinished()) {
      throw new CError(
        `Player try to replay but the game is not finished. This error should never happen.`,
        {
          code: ErrorConstants.ERROR.NOT_ALLOWED,
          meta: {
            game,
            socket,
            gameCode: game.code,
            playerId: socket.data.playerId,
          },
        },
      )
    }
    const stateManager = new GameStateManager(game)

    game.getPlayerById(socket.data.playerId)?.toggleReplay()

    game.restartGameIfAllPlayersWantReplay()

    this.sendGameUpdateToSocketAndRoom(socket, {
      room: game.code,
      stateManager,
    })
    await this.redis.updateGame(game)
  }

  //#region private methods
  protected async checkStateVersion(
    socket: SkyjoSocket,
    clientStateVersion: number | null,
    firstTime: boolean = false,
  ) {
    const game = await this.redis.getGame(socket.data.gameCode)

    if (clientStateVersion === null) {
      await this.sendGameToSocket(socket, game)

      if (firstTime) return

      throw new CError(
        "Client state version is null. This should never happen. Sent full state update",
        {
          code: ErrorConstants.ERROR.STATE_VERSION_NULL,
          meta: {
            gameCode: game.code,
            serverStateVersion: game.stateVersion,
            playerId: socket.data.playerId,
          },
        },
      )
    }

    if (clientStateVersion > game.stateVersion) {
      await this.sendGameToSocket(socket, game)
      throw new CError(
        "Client state version is ahead of server. This should never happen. Sent full state update",
        {
          code: ErrorConstants.ERROR.STATE_VERSION_AHEAD,
          meta: {
            clientStateVersion,
            serverStateVersion: game.stateVersion,
            gameCode: game.code,
            playerId: socket.data.playerId,
          },
        },
      )
    }

    if (clientStateVersion < game.stateVersion) {
      await this.sendGameToSocket(socket, game)
      throw new CError(
        "Client state is behind server, sent full state update",
        {
          code: ErrorConstants.ERROR.STATE_VERSION_BEHIND,
          level: "warn",
          meta: {
            clientStateVersion,
            serverStateVersion: game.stateVersion,
            gameCode: game.code,
            playerId: socket.data.playerId,
          },
        },
      )
    }
  }

  private async checkPlayAuthorization(
    socket: SkyjoSocket,
    allowedStates: TurnStatus[],
  ) {
    const game = await this.redis.getGame(socket.data.gameCode)

    // TODO remove this condition in 1.36.0 if game sync works and this error never happens in last versions
    if (
      !game.isPlaying() ||
      (game.roundStatus !== CoreConstants.ROUND_STATUS.MAIN &&
        game.roundStatus !== CoreConstants.ROUND_STATUS.LAST_LAP)
    ) {
      await this.sendGameToSocket(socket, game)
      throw new CError(
        `Player try to play but the game is not in playing state. This should not happen since the game sync was normally checked before. Sent game to the player to fix the issue.`,
        {
          code: ErrorConstants.ERROR.NOT_ALLOWED,
          level: "error",
          meta: {
            game,
            socket,
            gameCode: game.code,
            playerId: socket.data.playerId,
          },
        },
      )
    }

    const player = game.getPlayerById(socket.data.playerId)
    if (!player) {
      throw new CError(`Player try to play but is not found.`, {
        code: ErrorConstants.ERROR.PLAYER_NOT_FOUND,
        meta: {
          game,
          socket,
          gameCode: game.code,
          playerId: socket.data.playerId,
        },
      })
    }

    // TODO remove this condition in 1.36.0 if game sync works and this error never happens in last versions
    if (!game.checkTurn(player.id)) {
      await this.sendGameToSocket(socket, game)
      throw new CError(
        `Player try to play but it's not his turn. This should not happen since the game sync was normally checked before. Sent game to the player to fix the issue.`,
        {
          code: ErrorConstants.ERROR.NOT_ALLOWED,
          level: "error",
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

    // TODO remove this condition in 1.36.0 if game sync works and this error never happens in last versions
    if (allowedStates.length > 0 && !allowedStates.includes(game.turnStatus)) {
      await this.sendGameToSocket(socket, game)
      throw new CError(
        `Player try to play but the game is not in the allowed turn state. This should not happen since the game sync was normally checked before. Sent game to the player to fix the issue.`,
        {
          code: ErrorConstants.ERROR.INVALID_TURN_STATE,
          level: "error",
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

    return { player, game }
  }
  //#endregion
}
