import type { Avatar, ConnectionStatus } from "@/constants.js"
import type { SkyjoCardDb, SkyjoCardToJson } from "./skyjoCard.js"

export interface SkyjoPlayerPopulate {
  id: string
  name: string
  socketId: string
  avatar: Avatar
  score: number
  scores: SkyjoPlayerScores
  wantsReplay: boolean
  connectionStatus: ConnectionStatus
  cards: SkyjoCardDb[][]

  // Allow any additional fields, they will be ignored
  [key: string]: unknown
}

export type SkyjoPlayerScores = (number | "-")[]

export interface SkyjoPlayerToJson {
  id: string
  name: string
  readonly socketId: string
  readonly avatar: Avatar
  readonly score: number
  readonly wantsReplay: boolean
  readonly connectionStatus: ConnectionStatus
  readonly scores: SkyjoPlayerScores
  readonly currentScore: number
  readonly cards: SkyjoCardToJson[][]
  readonly isAdmin: boolean
}
