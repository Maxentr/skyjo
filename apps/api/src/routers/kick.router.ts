import { KickService } from "@/services/kick.service.js"
import { socketErrorHandlerWrapper } from "@/utils/socketErrorHandlerWrapper.js"
import {
  type InitiateKickVote,
  type VoteToKick,
  initiateKickVote,
  voteToKick,
} from "@skyjo/shared/validations/kick"
import type { SkyjoSocket } from "../types/skyjoSocket.js"

const instance = new KickService()

export const kickRouter = (socket: SkyjoSocket) => {
  socket.on(
    "kick:initiate-vote",
    socketErrorHandlerWrapper(async (data: InitiateKickVote) => {
      const { targetId } = initiateKickVote.parse(data)
      await instance.onInitiateKickVote(socket, targetId)
    }),
  )

  socket.on(
    "kick:vote",
    socketErrorHandlerWrapper(async (data: VoteToKick) => {
      const { vote } = voteToKick.parse(data)
      await instance.onVoteToKick(socket, vote)
    }),
  )
}
