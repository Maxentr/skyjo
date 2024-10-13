import { SkyjoPlayer } from "@/class/SkyjoPlayer"
import { db } from "database/provider"
import { playerTable } from "database/schema"
import { and, eq, inArray } from "drizzle-orm"
import {
  CONNECTION_LOST_TIMEOUT_IN_MS,
  CONNECTION_STATUS,
  LEAVE_TIMEOUT_IN_MS,
} from "shared/constants"

export class PlayerDb {
  async createPlayer(gameId: string, socketId: string, player: SkyjoPlayer) {
    const [newPlayer] = await db
      .insert(playerTable)
      .values({
        id: player.id,
        name: player.name,
        socketId,
        avatar: player.avatar,
        connectionStatus: player.connectionStatus,
        cards: player.cards,
        score: player.score,
        scores: player.scores,
        wantsReplay: player.wantsReplay,
        gameId,
      })
      .returning()

    if (!newPlayer) throw new Error("Error while inserting player in database")

    return newPlayer
  }

  async updatePlayer(player: SkyjoPlayer) {
    await db
      .update(playerTable)
      .set({
        avatar: player.avatar,
        connectionStatus: player.connectionStatus,
        cards: player.cards,
        score: player.score,
        scores: player.scores,
        wantsReplay: player.wantsReplay,
      })
      .where(eq(playerTable.id, player.id))
      .execute()
  }

  async updateSocketId(playerId: string, socketId: string) {
    await db
      .update(playerTable)
      .set({ socketId })
      .where(eq(playerTable.id, playerId))
      .execute()
  }

  async getPlayersByGameId(gameId: string) {
    const players = await db.query.playerTable.findMany({
      where: eq(playerTable.gameId, gameId),
    })

    return players
  }

  async canReconnect(playerId: string) {
    const player = await db.query.playerTable.findFirst({
      where: and(
        eq(playerTable.id, playerId),
        inArray(playerTable.connectionStatus, [
          CONNECTION_STATUS.CONNECTION_LOST,
          CONNECTION_STATUS.LEAVE,
          CONNECTION_STATUS.CONNECTED,
        ]),
      ),
    })

    if (!player) return false

    // This happend when the server has been restarted or has crashed
    if (
      !player.disconnectionDate &&
      player.connectionStatus === CONNECTION_STATUS.CONNECTED
    )
      return true
    else if (!player.disconnectionDate) return false

    const timeToAdd =
      player.connectionStatus === CONNECTION_STATUS.CONNECTION_LOST
        ? CONNECTION_LOST_TIMEOUT_IN_MS
        : LEAVE_TIMEOUT_IN_MS

    const maxReconnectionDate = new Date(
      player.disconnectionDate.getTime() + timeToAdd,
    )

    return maxReconnectionDate > new Date()
  }

  async updateDisconnectionDate(player: SkyjoPlayer, date: Date | null) {
    await db
      .update(playerTable)
      .set({ disconnectionDate: date })
      .where(eq(playerTable.id, player.id))
  }

  async reconnectPlayer(player: SkyjoPlayer) {
    await db
      .update(playerTable)
      .set({
        disconnectionDate: null,
        connectionStatus: CONNECTION_STATUS.CONNECTED,
      })
      .where(eq(playerTable.id, player.id))
  }

  async removePlayer(gameId: string, playerId: string) {
    await db
      .delete(playerTable)
      .where(and(eq(playerTable.gameId, gameId), eq(playerTable.id, playerId)))
  }
}
