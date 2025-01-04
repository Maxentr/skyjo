import type { InitiateKickVote, VoteToKick } from "@/validations/kick.js"
import type { KickVoteToJson } from "@skyjo/core"

export interface ClientToServerKickEvents {
  "kick:initiate-vote": (data: InitiateKickVote) => void
  "kick:vote": (data: VoteToKick) => void
}

export interface ServerToClientKickEvents {
  "kick:vote": (data: KickVoteToJson) => void
  "kick:vote-success": (
    playerToKickId: string,
    playerToKickName: string,
  ) => void
  "kick:vote-failed": (playerToKickId: string, playerToKickName: string) => void
}
