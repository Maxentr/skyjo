import type { LastGame } from "@/validations/reconnect.js"
import type { Error as ThrownError } from "@skyjo/error"
export interface ClientToServerPlayerEvents {
  reconnect: (data: LastGame) => void
  leave: () => void
  disconnect: () => void
}

export type ErrorReconnectMessage = Extract<ThrownError, "cannot-reconnect">
export interface ServerToClientPlayerEvents {
  "error:reconnect": (message: ErrorReconnectMessage) => void
  "leave:success": () => void
}
