import type { Avatar, ConnectionStatus } from "@/constants.js"
import type { SkyjoCardDb, SkyjoCardToJson } from "./skyjoCard.js"

export type SkyjoPlayerPopulate = {
  id: string
  name: string
  socketId: string
  avatar: Avatar
  connectionStatus: ConnectionStatus
  cards: SkyjoCardDb[][]
  score: number
  scores: SkyjoPlayerScores
  hasPlayedLastTurn: boolean
  wantsReplay: boolean

  // Allow any additional fields, they will be ignored
  [key: string]: unknown
}

export type SkyjoPlayerScores = (number | "-")[]

export type SkyjoPlayerToJson = {
  id: string
  name: string
  socketId: string
  avatar: Avatar
  connectionStatus: ConnectionStatus
  cards: SkyjoCardToJson[][]
  score: number
  scores: SkyjoPlayerScores
  hasPlayedLastTurn: boolean
  wantsReplay: boolean
}
