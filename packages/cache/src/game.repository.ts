import {
  Constants as CoreConstants,
  Skyjo,
  type SkyjoDbFormat,
  type SkyjoPlayerToJson,
} from "@skyjo/core"
import { CError, Constants as ErrorConstants } from "@skyjo/error"
import { type SkyjoOperation } from "@skyjo/state-operations"
import { RedisClient } from "./client.js"
export class GameRepository extends RedisClient {
  private static readonly GAME_PREFIX = "game"
  private static readonly GAME_STATE_PREFIX = "state"
  private static readonly GAME_LATEST_STATE_SUFFIX = "latest"

  private static readonly GAME_STATE_TTL = 60 * 2 // 2 minutes
  private static readonly GAME_TTL = 60 * 10 // 10 minutes
  private static readonly PUBLIC_GAME_IN_LOBBY_TTL = 60 * 4 // 4 minutes
  private static readonly PUBLIC_GAMES_SORTED_SET = "public_games"

  async createGame(game: Skyjo) {
    const existingGame = await this.getGameSafe(game.code)
    if (existingGame) {
      throw new CError("A game with this code already exists in cache", {
        code: ErrorConstants.ERROR.GAME_ALREADY_EXISTS,
        meta: { gameCode: game.code },
      })
    }

    await this.setGame(game)
  }

  async getPublicGames(nbPerPage: number, page: number) {
    const client = await RedisClient.getClient()

    const minScore = -Infinity
    const maxScore = Infinity

    const gameCodes = await client.zRange(
      GameRepository.PUBLIC_GAMES_SORTED_SET,
      minScore,
      maxScore,
      {
        BY: "SCORE",
        LIMIT: { offset: nbPerPage * (page - 1), count: nbPerPage },
      },
    )
    const games = await Promise.all(
      gameCodes.map(async (code) => {
        const game = await this.getGameSafe(code)
        if (!game) await this.removeFromPublicGames(code)

        return game
      }),
    )

    const filteredGames = games.filter(
      (game): game is Skyjo =>
        game !== null && this.isGameEligibleToPublicGames(game),
    )

    return filteredGames
  }

  async getGameSafe(code: string = "") {
    try {
      return await this.getGame(code, false)
    } catch {
      return null
    }
  }

  async getGame(code: string = "", logError = true) {
    const client = await RedisClient.getClient()
    const key = this.getGameLatestStateKey(code)

    const game = (await client.json.get(key)) as SkyjoDbFormat | null
    if (!game) {
      throw new CError("Game not found in cache", {
        level: "warn",
        shouldLog: logError,
        code: ErrorConstants.ERROR.GAME_NOT_FOUND,
        meta: { gameCode: code },
      })
    }

    return this.deserializeGame(game)
  }

  async canReconnectPlayer(gameCode: string, playerId: string) {
    const client = await RedisClient.getClient()

    const key = this.getGameLatestStateKey(gameCode)
    const player = await client.json.get(key, {
      // and connectionStatus is not DISCONNECTED
      path: `$.players[?(@.id == '${playerId}' && @.connectionStatus != '${CoreConstants.CONNECTION_STATUS.DISCONNECTED}')]`,
    })

    return player !== null
  }

  async updateGame(game: Skyjo, operation?: SkyjoOperation) {
    if (operation) await this.addGameState(game, operation)

    await this.setGame(game)

    if (!game.settings.private) await this.updateInPublicGames(game)
  }

  async updatePlayer(gameCode: string, player: SkyjoPlayerToJson) {
    const client = await RedisClient.getClient()

    const key = this.getGameLatestStateKey(gameCode)
    await client.json.set(key, `$.players[?(@.id == '${player.id}')]`, player)
  }

  async updatePlayerSocketId(
    gameCode: string,
    playerId: string,
    socketId: string,
  ): Promise<void> {
    const client = await RedisClient.getClient()

    const key = this.getGameLatestStateKey(gameCode)
    await client.json.set(
      key,
      `$.players[?(@.id == '${playerId}')].socketId`,
      socketId,
    )
  }

  async removeGame(code: string): Promise<void> {
    await this.removeFromPublicGames(code)
    await this.deleteGame(code)
  }

  async removePlayer(gameCode: string, playerId: string): Promise<void> {
    const client = await RedisClient.getClient()

    const key = this.getGameLatestStateKey(gameCode)
    await client.json.del(key, `$.players[?(@.id == '${playerId}')]`)

    const game = await this.getGame(gameCode)
    if (!game.settings.private) await this.updateInPublicGames(game)
  }

  //#region state
  async getGameStates(
    gameCode: string,
    fromStateVersion: number,
    toStateVersion: number,
  ): Promise<SkyjoOperation[]> {
    const client = await RedisClient.getClient()

    const states: SkyjoOperation[] = []

    for (let i = fromStateVersion; i <= toStateVersion; i++) {
      const key = this.getGameStateKey(gameCode, i)
      const state = await client.json.get(key)
      states.push(state as SkyjoOperation)
    }

    return states
  }
  //#endregion

  //#region private methods
  private getGameLatestStateKey(code: string): string {
    return `${GameRepository.GAME_PREFIX}:${code}:${GameRepository.GAME_LATEST_STATE_SUFFIX}`
  }

  private getGameStateKey(code: string, stateVersion: number | "*"): string {
    return `${GameRepository.GAME_PREFIX}:${code}:${GameRepository.GAME_STATE_PREFIX}:${stateVersion}`
  }

  private deserializeGame(game: SkyjoDbFormat): Skyjo {
    const skyjo = new Skyjo(game.adminId)
    skyjo.populate(game)

    return skyjo
  }

  private async setGame(game: Skyjo) {
    const client = await RedisClient.getClient()

    const key = this.getGameLatestStateKey(game.code)
    const json = game.serializeGame()

    await client.json.set(key, "$", json)

    const ttl =
      !game.settings.private && game.isInLobby()
        ? GameRepository.PUBLIC_GAME_IN_LOBBY_TTL
        : GameRepository.GAME_TTL

    await client.expire(key, ttl)
  }

  //#region public games
  private isGameEligibleToPublicGames(game: Skyjo) {
    return (
      !game.settings.private &&
      game.isInLobby() &&
      !game.isFull() &&
      game.settings.isConfirmed
    )
  }

  private async updateInPublicGames(game: Skyjo) {
    if (this.isGameEligibleToPublicGames(game)) {
      const client = await RedisClient.getClient()

      await client.zAdd(GameRepository.PUBLIC_GAMES_SORTED_SET, {
        score: -game.players.length,
        value: game.code,
      })
    } else {
      await this.removeFromPublicGames(game.code)
    }
  }
  private async removeFromPublicGames(code: string) {
    const client = await RedisClient.getClient()

    await client.zRem(GameRepository.PUBLIC_GAMES_SORTED_SET, code)
  }
  //#endregion

  private async addGameState(game: Skyjo, operation: SkyjoOperation) {
    const client = await RedisClient.getClient()

    const key = this.getGameStateKey(game.code, game.stateVersion)
    await client.json.set(key, "$", operation)
    await client.expire(key, GameRepository.GAME_STATE_TTL)
  }

  private async deleteGame(gameCode: string) {
    const client = await RedisClient.getClient()

    do {
      const gameKeys = await client.keys(
        `${GameRepository.GAME_PREFIX}:${gameCode}:*`,
      )
      await client.del(gameKeys)
    } while (await client.keys(`${GameRepository.GAME_PREFIX}:${gameCode}:*`))
  }

  //#endregion
}
