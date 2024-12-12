import { KickService } from "@/socketio/services/kick.service.js"
import { socketErrorWrapper } from "@/socketio/utils/socketErrorWrapper.js"
import {
  type InitiateKickVote,
  type VoteToKick,
  initiateKickVote,
  voteToKick,
} from "@skyjo/shared/validations"
import type { SkyjoSocket } from "../types/skyjoSocket.js"

const instance = new KickService()

export const kickRouter = (socket: SkyjoSocket) => {
  socket.on(
    "kick:initiate-vote",
    socketErrorWrapper(async (data: InitiateKickVote) => {
      const { targetId } = initiateKickVote.parse(data)
      await instance.onInitiateKickVote(socket, targetId)
    }),
  )

  socket.on(
    "kick:vote",
    socketErrorWrapper(async (data: VoteToKick) => {
      const { vote } = voteToKick.parse(data)
      await instance.onVoteToKick(socket, vote)
    }),
  )
}
