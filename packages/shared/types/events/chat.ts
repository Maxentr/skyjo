import type {
  ServerChatMessage,
  SystemChatMessage,
  UserChatMessage,
} from "@/types/chat.js"
import type { SendChatMessage } from "@/validations/chatMessage.js"

export interface ClientToServerChatEvents {
  message: (message: SendChatMessage) => void
}

export interface ServerToClientChatEvents {
  message: (message: UserChatMessage) => void
  "message:system": (message: SystemChatMessage) => void
  "message:server": (message: ServerChatMessage) => void
}
