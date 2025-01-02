import { isDeepStrictEqual } from "util"
import type {
  Skyjo,
  SkyjoPlayerToJson,
  SkyjoSettingsToJson,
  SkyjoToJson,
} from "@skyjo/core"
import type {
  PlayerUpdate,
  SkyjoOperation,
  SkyjoUpdate,
} from "@skyjo/shared/types"

export class GameStateManager {
  private previousState: SkyjoToJson

  private readonly game: Skyjo

  constructor(game: Skyjo) {
    this.previousState = structuredClone(game.toJson())
    this.game = game
  }

  getChanges(): SkyjoOperation | null {
    const currentState = this.game.toJson()
    const operations = this.createStateOperations(
      this.previousState,
      currentState,
    )

    if (Object.keys(operations).length === 0) return null

    this.previousState = structuredClone(currentState)

    return operations
  }

  //#region private methods
  private createStateOperations(
    oldState: SkyjoToJson,
    newState: SkyjoToJson,
  ): SkyjoOperation {
    let ops: SkyjoOperation = {}

    const basicFieldsChanges = this.compareBasicFields(oldState, newState)
    if (basicFieldsChanges) ops.game = basicFieldsChanges

    const settingsChanges = this.compareSettings(
      oldState.settings,
      newState.settings,
    )
    if (settingsChanges) ops.settings = settingsChanges

    const playerOps = this.createPlayerOperations(oldState, newState)
    if (Object.keys(playerOps).length > 0) ops = { ...ops, ...playerOps }

    // Increment state version if there are any changes
    if (Object.keys(ops).length > 0) {
      this.game.stateVersion++
      ops.game = { ...ops.game, stateVersion: this.game.stateVersion }
    }

    return ops
  }

  private compareBasicFields(
    oldState: SkyjoToJson,
    newState: SkyjoToJson,
  ): SkyjoUpdate | undefined {
    let gameChanges: SkyjoUpdate = {}

    const keys = Object.keys(oldState) as Array<keyof SkyjoToJson>
    keys.forEach((key) => {
      if (key === "settings" || key === "players") return
      else if (!isDeepStrictEqual(oldState[key], newState[key])) {
        gameChanges = {
          ...gameChanges,
          [key]: newState[key],
        }
      }
    })

    if (Object.keys(gameChanges).length > 0) {
      return gameChanges
    }
  }

  private compareSettings(
    oldSettings: SkyjoSettingsToJson,
    newSettings: SkyjoSettingsToJson,
  ): Partial<SkyjoSettingsToJson> | undefined {
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
      return settingsChanges
    }
  }

  private createPlayerOperations(
    oldState: SkyjoToJson,
    newState: SkyjoToJson,
  ): Omit<SkyjoOperation, "game" | "settings"> {
    const ops: Omit<SkyjoOperation, "game" | "settings"> = {}

    oldState.players.forEach((oldPlayer) => {
      const newPlayer = newState.players.find((p) => p.id === oldPlayer.id)
      if (!newPlayer) {
        ops.removePlayers ??= []
        ops.removePlayers.push(oldPlayer.id)
        return
      }
      const playerChanges = this.comparePlayer(oldPlayer, newPlayer)

      if (playerChanges) {
        ops.updatePlayers ??= []
        ops.updatePlayers.push(playerChanges)
      }
    })

    newState.players.slice(oldState.players.length).forEach((newPlayer) => {
      ops.addPlayers ??= []
      ops.addPlayers.push(newPlayer)
    })

    return ops
  }

  private comparePlayer(
    oldPlayer: SkyjoPlayerToJson,
    newPlayer: SkyjoPlayerToJson,
  ): PlayerUpdate | undefined {
    const playerId = oldPlayer.id
    let playerChanges: Partial<SkyjoPlayerToJson> = {}

    const keys = Object.keys(oldPlayer) as Array<keyof SkyjoPlayerToJson>
    keys.forEach((key) => {
      if (
        newPlayer[key] !== undefined &&
        !isDeepStrictEqual(oldPlayer[key], newPlayer[key])
      ) {
        playerChanges = {
          ...playerChanges,
          [key]: newPlayer[key],
        }
      }
    })

    if (Object.keys(playerChanges).length > 0) {
      return { ...playerChanges, id: playerId }
    }
  }
  //#endregion
}
