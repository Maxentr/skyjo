import type {
  ChangeSettingsInput,
  CreatePlayer,
  JoinGame,
  PlayPickCard,
  PlayReplaceCard,
  PlayRevealCard,
  PlayTurnCard,
  SkyjoToJson,
} from "@skyjo/core"
import type { KickVoteToJson } from "@skyjo/core"
import type { Error as ThrownError } from "@skyjo/error"
import type {
  ServerChatMessage,
  SystemChatMessage,
  UserChatMessage,
} from "../types/chat.js"
import type { SendChatMessage } from "../validations/chatMessage.js"
import type { InitiateKickVote, VoteToKick } from "../validations/kick.js"
import type { LastGame } from "../validations/reconnect.js"

export type ClientToServerEvents = {
  "create-private": (player: CreatePlayer) => void
  find: (player: CreatePlayer) => void
  join: (data: JoinGame) => void
  reconnect: (data: LastGame) => void
  get: () => void
  start: () => void
  settings: (data: ChangeSettingsInput) => void
  message: (message: SendChatMessage) => void
  "play:reveal-card": (data: PlayRevealCard) => void
  "play:pick-card": (data: PlayPickCard) => void
  "play:replace-card": (data: PlayReplaceCard) => void
  "play:discard-selected-card": () => void
  "play:turn-card": (data: PlayTurnCard) => void
  replay: () => void
  leave: () => void
  disconnect: () => void
  "kick:initiate-vote": (data: InitiateKickVote) => void
  "kick:vote": (data: VoteToKick) => void
}

export type ErrorJoinMessage = Extract<
  ThrownError,
  "game-not-found" | "game-already-started" | "game-is-full"
>
export type ErrorReconnectMessage = Extract<ThrownError, "cannot-reconnect">

export type ServerToClientEvents = {
  "error:join": (message: ErrorJoinMessage) => void
  "error:reconnect": (message: ErrorReconnectMessage) => void
  join: (game: SkyjoToJson, playerId: string) => void
  game: (game: SkyjoToJson) => void
  message: (message: UserChatMessage) => void
  "message:system": (message: SystemChatMessage) => void
  "message:server": (message: ServerChatMessage) => void
  "leave:success": () => void
  "kick:vote": (data: KickVoteToJson) => void
  "kick:vote-success": (data: KickVoteToJson) => void
  "kick:vote-failed": (data: KickVoteToJson) => void
}

export type SocketData = {
  gameCode: string
  playerId: string
}
