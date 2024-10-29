import type { SkyjoPlayerToJson, SkyjoToJson } from "@skyjo/core"
import { CError, Constants as ErrorConstants } from "@skyjo/error"
import type { SkyjoOperation } from "../types/operation.js"

export const applyOperations = (
  game: SkyjoToJson,
  operations: SkyjoOperation[],
): SkyjoToJson => {
  const gameUpdated = game

  operations.forEach(([op, data]) => {
    switch (op) {
      case "status":
        gameUpdated.status = data
        break
      case "adminId":
        gameUpdated.adminId = data
        break
      case "turn":
        gameUpdated.turn = data
        break
      case "roundStatus":
        gameUpdated.roundStatus = data
        break
      case "turnStatus":
        gameUpdated.turnStatus = data
        break
      case "lastTurnStatus":
        gameUpdated.lastTurnStatus = data
        break
      case "selectedCardValue":
        gameUpdated.selectedCardValue = data
        break
      case "lastDiscardCardValue":
        gameUpdated.lastDiscardCardValue = data
        break
      case "updatedAt":
        gameUpdated.updatedAt = data
        break
      case "settings":
        Object.assign(gameUpdated.settings, data)
        break
      // player operations
      case "player:socketId":
        updatePlayer(gameUpdated, data.playerId, "socketId", data.value)
        break
      case "player:cards":
        updatePlayer(gameUpdated, data.playerId, "cards", data.value)
        break
      case "player:score":
        updatePlayer(gameUpdated, data.playerId, "score", data.value)
        break
      case "player:scores":
        updatePlayer(gameUpdated, data.playerId, "scores", data.value)
        break
      case "player:connectionStatus":
        updatePlayer(gameUpdated, data.playerId, "connectionStatus", data.value)
        break
      case "player:wantsReplay":
        updatePlayer(gameUpdated, data.playerId, "wantsReplay", data.value)
        break
      case "player:remove":
        gameUpdated.players = gameUpdated.players.filter(
          (player) => player.id !== data,
        )
        break
      default:
        throw new CError("Unknown operation during applyOperations", {
          code: ErrorConstants.ERROR.UNKNOWN_OPERATION,
          meta: {
            game,
            operationFailed: {
              operation: op,
              data,
            },
          },
        })
    }
  })

  // clean up undefined cards
  gameUpdated.players.forEach((player) => {
    player.cards = player.cards.map((row) =>
      row.filter((card) => card !== undefined),
    )
  })

  return gameUpdated
}

const updatePlayer = <T extends keyof SkyjoPlayerToJson>(
  game: SkyjoToJson,
  playerId: string,
  key: T,
  value: SkyjoPlayerToJson[T],
) => {
  const playerIndex = game.players.findIndex((p) => p.id === playerId)
  game.players[playerIndex] = { ...game.players[playerIndex], [key]: value }
}
