import type { SkyjoPlayerToJson } from "@skyjo/core"
import type { Skyjo } from "@skyjo/core"

export type PublicGame = Pick<Skyjo, "code"> & {
  players: Pick<SkyjoPlayerToJson, "name" | "avatar">[]
}
