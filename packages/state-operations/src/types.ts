import type {
  SkyjoPlayerToJson,
  SkyjoSettingsToJson,
  SkyjoToJson,
} from "@skyjo/core"

export type SkyjoUpdate = Omit<Partial<SkyjoToJson>, "settings" | "players">

export type PlayerUpdate = Partial<SkyjoPlayerToJson> & {
  id: string
}
export type SkyjoOperation = Partial<{
  game: SkyjoUpdate
  settings: Partial<SkyjoSettingsToJson>
  addPlayers: SkyjoPlayerToJson[]
  updatePlayers: PlayerUpdate[]
  removePlayers: string[]
}>
