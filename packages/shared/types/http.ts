import type { Skyjo, SkyjoPlayerToJson } from "@skyjo/core"

export type PublicGameTag =
  | "classic"
  | "column"
  | "row"
  | "short-game"
  | "long-game"

export type PublicGame = Pick<Skyjo, "code"> & {
  adminName: string
  maxPlayers: number
  players: Pick<SkyjoPlayerToJson, "name" | "avatar" | "id">[]
  tags: PublicGameTag[]
}
