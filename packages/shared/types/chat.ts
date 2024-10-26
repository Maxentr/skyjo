import type {
  ServerMessageType,
  SystemMessageType,
  UserMessageType,
} from "@skyjo/core"

export type UserChatMessage = {
  id: string
  username: string
  message: string
  type: UserMessageType
}

export type SystemChatMessage = {
  id: string
  message: string
  type: SystemMessageType
}

export type ServerChatMessage = {
  id: string
  username: string
  message: ServerMessageType
  type: ServerMessageType
}

export type ChatMessage =
  | UserChatMessage
  | SystemChatMessage
  | ServerChatMessage
