import { ChatService } from "@/socketio/services/chat.service.js"
import { consumeSocketRateLimiter } from "@/socketio/utils/rateLimiter.js"
import { socketErrorWrapper } from "@/socketio/utils/socketErrorWrapper.js"
import {
  type SendChatMessage,
  type WizzPlayerUsername,
  sendChatMessage,
  wizzPlayerUsername,
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

const rateLimiterWizz = new RateLimiterMemory({
  keyPrefix: "chat-wizz",
  points: 1,
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

  socket.on(
    "wizz",
    socketErrorWrapper(async (data: WizzPlayerUsername) => {
      await consumeSocketRateLimiter(rateLimiterWizz)(socket)

      const targetUsername = wizzPlayerUsername.parse(data)

      await instance.onWizz(socket, targetUsername)
    }),
  )
}

export { chatRouter }
