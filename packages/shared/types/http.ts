import type { SkyjoPlayerToJson } from "@skyjo/core"
import type { Skyjo } from "@skyjo/core"

export type PublicGame = Pick<Skyjo, "code"> & {
  adminName: string
  maxPlayers: number
  players: Pick<SkyjoPlayerToJson, "name" | "avatar" | "id">[]
}
