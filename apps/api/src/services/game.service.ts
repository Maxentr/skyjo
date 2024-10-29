import type { SkyjoSocket } from "@/types/skyjoSocket.js"
import { GameStateManager } from "@/utils/GameStateManager.js"
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
  async onGet(socket: SkyjoSocket) {
    const game = await this.redis.getGame(socket.data.gameCode)

    socket.emit("game", game.toJson())
  }

  async onRevealCard(socket: SkyjoSocket, turnData: PlayRevealCard) {
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
      game.status !== CoreConstants.GAME_STATUS.PLAYING ||
      game.roundStatus !==
        CoreConstants.ROUND_STATUS.WAITING_PLAYERS_TO_TURN_INITIAL_CARDS
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

    game.checkAllPlayersRevealedCards(game.settings.initialTurnedCount)

    this.sendGameUpdateToSocketAndRoom(socket, stateManager)
    await this.redis.updateGame(game)
  }

  async onPickCard(socket: SkyjoSocket, { pile }: PlayPickCard) {
    const { game } = await this.checkPlayAuthorization(socket, [
      CoreConstants.TURN_STATUS.CHOOSE_A_PILE,
    ])
    const stateManager = new GameStateManager(game)

    if (pile === "draw") game.drawCard()
    else game.pickFromDiscard()

    this.sendGameUpdateToSocketAndRoom(socket, stateManager)
    await this.redis.updateGame(game)
  }

  async onReplaceCard(socket: SkyjoSocket, { column, row }: PlayReplaceCard) {
    const { game } = await this.checkPlayAuthorization(socket, [
      CoreConstants.TURN_STATUS.REPLACE_A_CARD,
      CoreConstants.TURN_STATUS.THROW_OR_REPLACE,
    ])
    const stateManager = new GameStateManager(game)

    game.replaceCard(column, row)

    this.sendGameUpdateToSocketAndRoom(socket, stateManager)
    await this.redis.updateGame(game)

    await this.finishTurn(socket, game)
    this.sendGameUpdateToSocketAndRoom(socket, stateManager)
  }

  async onDiscardCard(socket: SkyjoSocket) {
    const { game } = await this.checkPlayAuthorization(socket, [
      CoreConstants.TURN_STATUS.THROW_OR_REPLACE,
    ])
    const stateManager = new GameStateManager(game)

    game.discardCard(game.selectedCardValue!)

    this.sendGameUpdateToSocketAndRoom(socket, stateManager)
    await this.redis.updateGame(game)
  }

  async onTurnCard(socket: SkyjoSocket, { column, row }: PlayTurnCard) {
    const { game, player } = await this.checkPlayAuthorization(socket, [
      CoreConstants.TURN_STATUS.TURN_A_CARD,
    ])
    const stateManager = new GameStateManager(game)

    game.turnCard(player, column, row)

    this.sendGameUpdateToSocketAndRoom(socket, stateManager)
    await this.redis.updateGame(game)

    await this.finishTurn(socket, game)
    this.sendGameUpdateToSocketAndRoom(socket, stateManager)
  }

  async onReplay(socket: SkyjoSocket) {
    const game = await this.redis.getGame(socket.data.gameCode)
    if (game.status !== CoreConstants.GAME_STATUS.FINISHED) {
      throw new CError(`Player try to replay but the game is not finished.`, {
        code: ErrorConstants.ERROR.NOT_ALLOWED,
        meta: {
          game,
          socket,
          gameCode: game.code,
          playerId: socket.data.playerId,
        },
      })
    }
    const stateManager = new GameStateManager(game)

    game.getPlayerById(socket.data.playerId)?.toggleReplay()

    game.restartGameIfAllPlayersWantReplay()

    this.sendGameUpdateToSocketAndRoom(socket, stateManager)
    await this.redis.updateGame(game)
  }

  //#region private methods
  private async checkPlayAuthorization(
    socket: SkyjoSocket,
    allowedStates: TurnStatus[],
  ) {
    const game = await this.redis.getGame(socket.data.gameCode)

    if (
      game.status !== CoreConstants.GAME_STATUS.PLAYING ||
      (game.roundStatus !== CoreConstants.ROUND_STATUS.PLAYING &&
        game.roundStatus !== CoreConstants.ROUND_STATUS.LAST_LAP)
    ) {
      await this.sendGameToSocket(socket, game)
      throw new CError(
        `Player try to play but the game is not in playing state. Sent game to the player to fix the issue.`,
        {
          code: ErrorConstants.ERROR.NOT_ALLOWED,
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

    if (!game.checkTurn(player.id)) {
      await this.sendGameToSocket(socket, game)
      throw new CError(
        `Player try to play but it's not his turn. Sent game to the player to fix the issue.`,
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

    if (allowedStates.length > 0 && !allowedStates.includes(game.turnStatus)) {
      await this.sendGameToSocket(socket, game)
      throw new CError(
        `Player try to play but the game is not in the allowed turn state. Sent game to the player to fix the issue.`,
        {
          code: ErrorConstants.ERROR.INVALID_TURN_STATE,
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

    return { player, game }
  }
  //#endregion
}
