import type {
  SkyjoPlayerToJson,
  SkyjoSettingsToJson,
  SkyjoToJson,
} from "@skyjo/core"
import type {
  PlayerUpdate,
  SkyjoOperation,
  SkyjoUpdate,
} from "../types/operation.js"

const actions: Record<
  keyof SkyjoOperation,
  (game: SkyjoToJson, data: SkyjoOperation[keyof SkyjoOperation]) => void
> = {
  game: (game, data) => updateGameBasicFields(game, data as SkyjoUpdate),
  settings: (game, data) =>
    updateSettings(game, data as Partial<SkyjoSettingsToJson>),
  addPlayers: (game, data) => addPlayers(game, data as SkyjoPlayerToJson[]),
  updatePlayers: (game, data) => updatePlayers(game, data as PlayerUpdate[]),
  removePlayers: (game, data) => removePlayers(game, data as string[]),
}

export const applyOperations = (
  game: SkyjoToJson,
  operations: SkyjoOperation,
): SkyjoToJson => {
  const gameUpdated = game

  const keys = Object.keys(operations) as (keyof SkyjoOperation)[]
  keys.forEach((key) => {
    const data = operations[key]

    if (!data) return

    actions[key](gameUpdated, data)
  })

  // clean up undefined cards
  gameUpdated.players.forEach((player) => {
    player.cards = player.cards.map((row) =>
      row.filter((card) => card !== undefined),
    )
  })

  return gameUpdated
}

const updateGameBasicFields = (game: SkyjoToJson, data: SkyjoUpdate) => {
  Object.assign(game, data)
}

const updateSettings = (
  game: SkyjoToJson,
  data: Partial<SkyjoSettingsToJson>,
) => {
  Object.assign(game.settings, data)
}

const addPlayers = (game: SkyjoToJson, players: SkyjoPlayerToJson[]) => {
  game.players.push(...players)
}

const updatePlayers = (game: SkyjoToJson, operations: PlayerUpdate[]) => {
  operations.forEach(({ id, ...rest }) => {
    const playerIndex = game.players.findIndex((p) => p.id === id)

    game.players[playerIndex] = Object.assign(game.players[playerIndex], rest)
  })
}

const removePlayers = (game: SkyjoToJson, playerIds: string[]) => {
  game.players = game.players.filter((player) => !playerIds.includes(player.id))
}
