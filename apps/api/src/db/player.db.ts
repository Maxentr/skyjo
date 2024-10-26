import { Constants as CoreConstants, SkyjoPlayer } from "@skyjo/core"
import { db } from "@skyjo/database/provider"
import { playerTable } from "@skyjo/database/schema"
import { CError } from "@skyjo/error"

import { Constants as SharedConstants } from "@skyjo/shared/constants"
import { and, eq, inArray } from "drizzle-orm"

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

    if (!newPlayer) {
      throw new CError("Error while inserting player in database", {
        meta: {
          playerId: player.id,
          player,
        },
      })
    }

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
          CoreConstants.CONNECTION_STATUS.CONNECTION_LOST,
          CoreConstants.CONNECTION_STATUS.LEAVE,
          CoreConstants.CONNECTION_STATUS.CONNECTED,
        ]),
      ),
    })

    if (!player) return false

    // This happend when the server has been restarted or has crashed
    if (
      !player.disconnectionDate &&
      player.connectionStatus === CoreConstants.CONNECTION_STATUS.CONNECTED
    )
      return true
    else if (!player.disconnectionDate) return false

    const timeToAdd =
      player.connectionStatus ===
      CoreConstants.CONNECTION_STATUS.CONNECTION_LOST
        ? SharedConstants.CONNECTION_LOST_TIMEOUT_IN_MS
        : SharedConstants.LEAVE_TIMEOUT_IN_MS

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
        connectionStatus: CoreConstants.CONNECTION_STATUS.CONNECTED,
      })
      .where(eq(playerTable.id, player.id))
  }

  async removePlayer(gameId: string, playerId: string) {
    await db
      .delete(playerTable)
      .where(and(eq(playerTable.gameId, gameId), eq(playerTable.id, playerId)))
  }
}
