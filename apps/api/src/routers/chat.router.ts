import { ChatService } from "@/services/chat.service.js"
import { socketErrorHandlerWrapper } from "@/utils/socketErrorHandlerWrapper.js"
import {
  type SendChatMessage,
  sendChatMessage,
} from "@skyjo/shared/validations/chatMessage"
import type { SkyjoSocket } from "../types/skyjoSocket.js"

const instance = new ChatService()

const chatRouter = (socket: SkyjoSocket) => {
  socket.on(
    "message",
    socketErrorHandlerWrapper(async (data: SendChatMessage) => {
      const message = sendChatMessage.parse(data)
      await instance.onMessage(socket, message)
    }),
  )
}

export { chatRouter }
