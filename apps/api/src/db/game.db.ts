import { PlayerDb } from "@/db/player.db.js"
import { ENV } from "@env"
import { Constants as CoreConstants, Skyjo, SkyjoSettings } from "@skyjo/core"
import { CError } from "@skyjo/error"
import { Logger } from "@skyjo/logger"
import { db } from "database/provider"
import { type DbGame, gameTable, playerTable } from "database/schema"
import dayjs from "dayjs"
import { and, eq, lte } from "drizzle-orm"

export class GameDb {
  playerDb: PlayerDb

  constructor() {
    this.playerDb = new PlayerDb()
  }

  async createGame(game: Skyjo) {
    const [dbGame] = await db
      .insert(gameTable)
      .values({
        id: game.id,
        code: game.code,
        status: game.status,
        turn: game.turn,
        turnStatus: game.turnStatus,
        lastTurnStatus: game.lastTurnStatus,
        roundStatus: game.roundStatus,
        roundNumber: game.roundNumber,
        drawPile: game.drawPile,
        discardPile: game.discardPile,
        adminId: game.adminId,
        isFull: game.isFull(),

        isPrivate: game.settings.private,
        maxPlayers: game.settings.maxPlayers,
        allowSkyjoForColumn: game.settings.allowSkyjoForColumn,
        allowSkyjoForRow: game.settings.allowSkyjoForRow,
        initialTurnedCount: game.settings.initialTurnedCount,
        cardPerRow: game.settings.cardPerRow,
        cardPerColumn: game.settings.cardPerColumn,
        scoreToEndGame: game.settings.scoreToEndGame,
        multiplierForFirstPlayer: game.settings.multiplierForFirstPlayer,

        region: ENV.REGION,
      })
      .returning()

    if (!dbGame) {
      throw new CError("Error while inserting game in database", {
        meta: {
          game,
        },
      })
    }

    return dbGame
  }

  async updateGame(game: Skyjo, updatePlayers = true) {
    await db
      .update(gameTable)
      .set({
        status: game.status,
        turn: game.turn,
        turnStatus: game.turnStatus,
        lastTurnStatus: game.lastTurnStatus,
        roundStatus: game.roundStatus,
        roundNumber: game.roundNumber,
        drawPile: game.drawPile,
        discardPile: game.discardPile,
        isFull: game.isFull(),
        updatedAt: new Date(),
      })
      .where(and(eq(gameTable.id, game.id), eq(gameTable.region, ENV.REGION)))
      .execute()

    if (updatePlayers) {
      const playersPromises = game.players.map((player) => {
        this.playerDb.updatePlayer(player)
      })

      await Promise.all(playersPromises)
    }
  }

  async updateSettings(gameId: string, setting: SkyjoSettings) {
    await db
      .update(gameTable)
      .set({
        isPrivate: setting.private,
        maxPlayers: setting.maxPlayers,
        allowSkyjoForColumn: setting.allowSkyjoForColumn,
        allowSkyjoForRow: setting.allowSkyjoForRow,
        initialTurnedCount: setting.initialTurnedCount,
        cardPerRow: setting.cardPerRow,
        cardPerColumn: setting.cardPerColumn,
        scoreToEndGame: setting.scoreToEndGame,
        multiplierForFirstPlayer: setting.multiplierForFirstPlayer,
      })
      .where(and(eq(gameTable.id, gameId), eq(gameTable.region, ENV.REGION)))
      .execute()
  }

  async updateAdmin(gameId: string, adminId: string) {
    await db
      .update(gameTable)
      .set({
        adminId,
      })
      .where(and(eq(gameTable.id, gameId), eq(gameTable.region, ENV.REGION)))
      .execute()
  }

  async getGamesByRegion() {
    const games = await db.query.gameTable.findMany({
      where: eq(gameTable.region, ENV.REGION),
    })

    return await this.formatArraySkyjo(games)
  }

  async getGameById(gameId: string) {
    const game = await db.query.gameTable.findFirst({
      where: and(eq(gameTable.id, gameId), eq(gameTable.region, ENV.REGION)),
      with: {
        players: true,
      },
    })

    return game
  }

  async getGameByCode(code: string) {
    const game = await db.query.gameTable.findFirst({
      where: eq(gameTable.code, code),
    })

    return game ?? null
  }

  async getPublicGameWithFreePlace() {
    const game = await db.query.gameTable.findFirst({
      where: and(
        eq(gameTable.status, CoreConstants.GAME_STATUS.LOBBY),
        eq(gameTable.isFull, false),
        eq(gameTable.isPrivate, false),
        eq(gameTable.region, ENV.REGION),
      ),
    })

    if (!game) return null

    return game
  }

  async isPlayerInGame(code: string, playerId: string) {
    const game = await db
      .select({
        game: gameTable,
        player: playerTable,
      })
      .from(gameTable)
      .innerJoin(playerTable, eq(gameTable.id, playerTable.gameId))
      .where(
        and(
          eq(gameTable.code, code),
          eq(playerTable.id, playerId),
          eq(gameTable.region, ENV.REGION),
        ),
      )
      .execute()

    return game !== null
  }

  async retrieveGameByCode(code: string): Promise<Skyjo | undefined> {
    const game = await this.getGameByCode(code)

    if (!game) return undefined

    return this.formatSkyjo(game)
  }

  async removeGame(gameCode: string) {
    await db
      .delete(gameTable)
      .where(
        and(eq(gameTable.code, gameCode), eq(gameTable.region, ENV.REGION)),
      )
      .execute()
  }

  async removeInactiveGames() {
    const deletedGameIds = await db
      .delete(gameTable)
      .where(
        and(
          eq(gameTable.region, ENV.REGION),
          lte(gameTable.updatedAt, dayjs().subtract(10, "minutes").toDate()),
        ),
      )
      .returning({ id: gameTable.id })

    return deletedGameIds.map((game) => game.id)
  }

  private async formatArraySkyjo(games: DbGame[]): Promise<Skyjo[]> {
    const formattedGames: Skyjo[] = []
    for await (const game of games) {
      try {
        const skyjo = await this.formatSkyjo(game)

        formattedGames.push(skyjo)
      } catch (error) {
        Logger.error(`Error while formatting game code: ${game.code}`, {
          error,
        })

        continue
      }
    }

    return formattedGames
  }

  private async formatSkyjo(game: DbGame) {
    const players = await this.playerDb.getPlayersByGameId(game.id)

    const admin =
      players.find((player) => player.id === game.adminId)! ?? players[0]?.id

    if (!admin) {
      Logger.warn(
        `Impossible error while formatting game code: ${game.code}. Reason: no admin and no player in it. Game will be removed.`,
      )

      await this.removeGame(game.code)
    }

    const skyjo = new Skyjo(admin.id).populate(game, { players })
    return skyjo
  }
}
