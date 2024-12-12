import { ChatService } from "@/socketio/services/chat.service.js"
import { socketErrorWrapper } from "@/socketio/utils/socketErrorWrapper.js"
import {
  type SendChatMessage,
  sendChatMessage,
} from "@skyjo/shared/validations"
import type { SkyjoSocket } from "../types/skyjoSocket.js"

const instance = new ChatService()

const chatRouter = (socket: SkyjoSocket) => {
  socket.on(
    "message",
    socketErrorWrapper(async (data: SendChatMessage) => {
      const message = sendChatMessage.parse(data)
      await instance.onMessage(socket, message)
    }),
  )
}

export { chatRouter }
