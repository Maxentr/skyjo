import type { Skyjo, SkyjoPlayerToJson } from "@skyjo/core"

export type PublicGame = Pick<Skyjo, "code"> & {
  adminName: string
  maxPlayers: number
  players: Pick<SkyjoPlayerToJson, "name" | "avatar" | "id">[]
}
