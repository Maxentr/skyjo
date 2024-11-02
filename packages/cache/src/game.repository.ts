import {
  Constants as CoreConstants,
  Skyjo,
  type SkyjoPlayerToJson,
  type SkyjoToDb,
} from "@skyjo/core"
import { CError, Constants as ErrorConstants } from "@skyjo/error"
import { RedisClient } from "./client.js"

export class GameRepository extends RedisClient {
  private static readonly GAME_PREFIX = "game:"
  private static readonly GAME_TTL = 60 * 10 // 10 minutes

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

  async getPublicGameWithFreePlace() {
    const games = await this.getEligibleGames()

    return games
  }

  async getGameSafe(code: string = "") {
    try {
      return await this.getGame(code)
    } catch {
      return null
    }
  }

  async getGame(code: string = "") {
    const client = await RedisClient.getClient()
    const key = this.getGameKey(code)

    const game = await client.json.get(key)
    if (!game) {
      throw new CError("Game not found in cache", {
        level: "warn",
        code: ErrorConstants.ERROR.GAME_NOT_FOUND,
        meta: { gameCode: code },
      })
    }

    return this.deserializeGame(game as SkyjoToDb)
  }

  async canReconnectPlayer(gameCode: string, playerId: string) {
    const client = await RedisClient.getClient()

    const key = this.getGameKey(gameCode)
    const player = await client.json.get(key, {
      // and connectionStatus is not DISCONNECTED
      path: `$.players[?(@.id == '${playerId}' && @.connectionStatus != '${CoreConstants.CONNECTION_STATUS.DISCONNECTED}')]`,
    })

    return player !== null
  }

  async updateGame(game: Skyjo) {
    await this.setGame(game)
  }

  async updatePlayer(gameCode: string, player: SkyjoPlayerToJson) {
    const client = await RedisClient.getClient()

    const key = this.getGameKey(gameCode)
    await client.json.set(key, `$.players[?(@.id == '${player.id}')]`, player)
  }

  async updatePlayerSocketId(
    gameCode: string,
    playerId: string,
    socketId: string,
  ): Promise<void> {
    const client = await RedisClient.getClient()

    const key = this.getGameKey(gameCode)
    await client.json.set(
      key,
      `$.players[?(@.id == '${playerId}')].socketId`,
      socketId,
    )
  }

  async removeGame(code: string): Promise<void> {
    const client = await RedisClient.getClient()

    await client.del(this.getGameKey(code))
  }

  async removePlayer(gameCode: string, playerId: string): Promise<void> {
    const client = await RedisClient.getClient()

    const key = this.getGameKey(gameCode)
    await client.json.del(key, `$.players[?(@.id == '${playerId}')]`)
  }

  //#region private methods
  private getGameKey(code: string): string {
    return `${GameRepository.GAME_PREFIX}${code}`
  }

  private deserializeGame(game: SkyjoToDb): Skyjo {
    const skyjo = new Skyjo(game.adminId)
    skyjo.populate(game)

    return skyjo
  }

  private async setGame(game: Skyjo) {
    const client = await RedisClient.getClient()

    const key = this.getGameKey(game.code)
    const json = game.serializeGame()

    await client.json.set(key, "$", json)

    await client.expire(this.getGameKey(game.code), GameRepository.GAME_TTL)
  }
  //#endregion

  private async getEligibleGames() {
    const client = await RedisClient.getClient()
    const eligibleGames: Skyjo[] = []

    let cursor = 0
    do {
      const result = await client.scan(cursor, { MATCH: "game:*", COUNT: 100 })

      for (const key of result.keys) {
        const game = await this.getGame(
          key.replace(GameRepository.GAME_PREFIX, ""),
        )

        const isEligible =
          !game.settings.private &&
          game.status === CoreConstants.GAME_STATUS.LOBBY &&
          !game.isFull()

        if (isEligible) eligibleGames.push(game)
      }

      cursor = result.cursor
    } while (cursor !== 0)

    return eligibleGames
  }
}
