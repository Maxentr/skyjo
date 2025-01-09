import { isDeepStrictEqual } from "util"
import type {
  SkyjoPlayerToJson,
  SkyjoSettingsToJson,
  SkyjoToJson,
} from "@skyjo/core"
import {
  type PlayerUpdate,
  type SkyjoOperation,
  type SkyjoUpdate,
} from "./types.js"

export const createStateOperations = (
  oldState: SkyjoToJson,
  newState: SkyjoToJson,
): SkyjoOperation => {
  let ops: SkyjoOperation = {}

  const basicFieldsChanges = compareBasicFields(oldState, newState)
  if (basicFieldsChanges) ops.game = basicFieldsChanges

  const settingsChanges = compareSettings(oldState.settings, newState.settings)
  if (settingsChanges) ops.settings = settingsChanges

  const playerOps = createPlayerOperations(oldState, newState)
  if (Object.keys(playerOps).length > 0) ops = { ...ops, ...playerOps }

  if (Object.keys(ops).length > 0) {
    newState.stateVersion++
    ops.game = { ...ops.game, stateVersion: newState.stateVersion }
  }

  return ops
}

const compareBasicFields = (
  oldState: SkyjoToJson,
  newState: SkyjoToJson,
): SkyjoUpdate | undefined => {
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

const compareSettings = (
  oldSettings: SkyjoSettingsToJson,
  newSettings: SkyjoSettingsToJson,
): Partial<SkyjoSettingsToJson> | undefined => {
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

const createPlayerOperations = (
  oldState: SkyjoToJson,
  newState: SkyjoToJson,
): Omit<SkyjoOperation, "game" | "settings"> => {
  const ops: Omit<SkyjoOperation, "game" | "settings"> = {}

  oldState.players.forEach((oldPlayer) => {
    const newPlayer = newState.players.find((p) => p.id === oldPlayer.id)
    if (!newPlayer) {
      ops.removePlayers ??= []
      ops.removePlayers.push(oldPlayer.id)
      return
    }
    const playerChanges = comparePlayer(oldPlayer, newPlayer)

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

const comparePlayer = (
  oldPlayer: SkyjoPlayerToJson,
  newPlayer: SkyjoPlayerToJson,
): PlayerUpdate | undefined => {
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
