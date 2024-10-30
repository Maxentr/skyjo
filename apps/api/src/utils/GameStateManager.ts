import { isDeepStrictEqual } from "util"
import type {
  Skyjo,
  SkyjoPlayerToJson,
  SkyjoSettingsToJson,
  SkyjoToJson,
} from "@skyjo/core"
import type { SkyjoOperation } from "@skyjo/shared/types"

export class GameStateManager {
  private previousState: SkyjoToJson

  private readonly game: Skyjo

  constructor(game: Skyjo) {
    this.previousState = game.toJson()
    this.game = game
  }

  getChanges() {
    const currentState = this.game.toJson()
    const operations = this.createStateOperations(
      this.previousState,
      currentState,
    )

    this.previousState = currentState

    return operations
  }

  //#region private methods
  private createStateOperations(
    oldState: SkyjoToJson,
    newState: SkyjoToJson,
  ): SkyjoOperation[] {
    const ops: SkyjoOperation[] = []

    const basicOps = this.compareBasicFields(oldState, newState)
    ops.push(...basicOps)

    const settingsOps = this.compareSettings(
      oldState.settings,
      newState.settings,
    )
    ops.push(...settingsOps)

    oldState.players.forEach((oldPlayer, playerIdx) => {
      const newPlayer = newState.players[playerIdx]
      if (!newPlayer) {
        ops.push(["player:remove", oldPlayer.id])
        return
      }
      const playerOps = this.comparePlayer(oldPlayer, newPlayer)

      ops.push(...playerOps)
    })

    return ops
  }

  private compareBasicFields(
    oldState: SkyjoToJson,
    newState: SkyjoToJson,
  ): SkyjoOperation[] {
    const ops: SkyjoOperation[] = []

    if (oldState.status !== newState.status) {
      ops.push(["status", newState.status])
    }
    if (oldState.adminId !== newState.adminId) {
      ops.push(["adminId", newState.adminId])
    }
    if (oldState.turn !== newState.turn) {
      ops.push(["turn", newState.turn])
    }
    if (oldState.roundStatus !== newState.roundStatus) {
      ops.push(["roundStatus", newState.roundStatus])
    }
    if (oldState.turnStatus !== newState.turnStatus) {
      ops.push(["turnStatus", newState.turnStatus])
    }
    if (oldState.lastTurnStatus !== newState.lastTurnStatus) {
      ops.push(["lastTurnStatus", newState.lastTurnStatus])
    }
    if (oldState.selectedCardValue !== newState.selectedCardValue) {
      ops.push(["selectedCardValue", newState.selectedCardValue])
    }
    if (oldState.lastDiscardCardValue !== newState.lastDiscardCardValue) {
      ops.push(["lastDiscardCardValue", newState.lastDiscardCardValue])
    }
    if (oldState.updatedAt !== newState.updatedAt) {
      ops.push(["updatedAt", newState.updatedAt])
    }

    return ops
  }

  private compareSettings(
    oldSettings: SkyjoSettingsToJson,
    newSettings: SkyjoSettingsToJson,
  ): SkyjoOperation[] {
    const ops: SkyjoOperation[] = []
    let settingsChanges: Partial<SkyjoSettingsToJson> = {}

    const keys = Object.keys(oldSettings) as Array<keyof SkyjoSettingsToJson>
    keys.forEach((key) => {
      if (
        newSettings[key] !== undefined &&
        oldSettings[key] !== newSettings[key]
      ) {
        settingsChanges = {
          ...settingsChanges,
          [key]: newSettings[key],
        }
      }
    })

    if (Object.keys(settingsChanges).length > 0) {
      ops.push(["settings", settingsChanges])
    }

    return ops
  }

  private comparePlayer(
    oldPlayer: SkyjoPlayerToJson,
    newPlayer: SkyjoPlayerToJson,
  ): SkyjoOperation[] {
    const ops: SkyjoOperation[] = []
    const playerId = oldPlayer.id

    if (!isDeepStrictEqual(oldPlayer.scores, newPlayer.scores)) {
      ops.push(["player:scores", { playerId, value: newPlayer.scores }])
    }

    if (oldPlayer.connectionStatus !== newPlayer.connectionStatus) {
      ops.push([
        "player:connectionStatus",
        {
          playerId,
          value: newPlayer.connectionStatus,
        },
      ])
    }
    if (oldPlayer.wantsReplay !== newPlayer.wantsReplay) {
      ops.push([
        "player:wantsReplay",
        {
          playerId,
          value: newPlayer.wantsReplay,
        },
      ])
    }
    if (!isDeepStrictEqual(oldPlayer.cards, newPlayer.cards)) {
      ops.push(["player:cards", { playerId, value: newPlayer.cards }])
    }

    return ops
  }
  //#endregion
}
