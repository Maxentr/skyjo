import type { LastGame } from "@/validations/reconnect.js"
import type { Error as ThrownError } from "@skyjo/error"
export interface ClientToServerPlayerEvents {
  reconnect: (data: LastGame) => void
  leave: () => void
  disconnect: () => void
  recover: () => void
}

export type ErrorReconnectMessage = Extract<ThrownError, "cannot-reconnect">
export type ErrorRecoverMessage = Extract<ThrownError, "game-not-found">

export interface ServerToClientPlayerEvents {
  "error:reconnect": (message: ErrorReconnectMessage) => void
  "error:recover": (message: ErrorRecoverMessage) => void
  "leave:success": () => void
}
