import { ChatService } from "@/socketio/services/chat.service.js"
import { consumeSocketRateLimiter } from "@/socketio/utils/rate-limiter.js"
import { socketErrorWrapper } from "@/socketio/utils/socketErrorWrapper.js"
import {
  type SendChatMessage,
  sendChatMessage,
} from "@skyjo/shared/validations"
import { RateLimiterMemory } from "rate-limiter-flexible"
import type { SkyjoSocket } from "../types/skyjoSocket.js"

const instance = new ChatService()

const rateLimiter = new RateLimiterMemory({
  keyPrefix: "chat",
  points: 10,
  duration: 5,
  blockDuration: 20,
})

const chatRouter = (socket: SkyjoSocket) => {
  socket.on(
    "message",
    socketErrorWrapper(async (data: SendChatMessage) => {
      await consumeSocketRateLimiter(rateLimiter)(socket)

      const message = sendChatMessage.parse(data)
      await instance.onMessage(socket, message)
    }),
  )
}

export { chatRouter }
