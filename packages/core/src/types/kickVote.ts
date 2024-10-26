export type KickVoteToJson = {
  targetId: string
  initiatorId: string
  votes: { playerId: string; vote: boolean }[]
  requiredVotes: number
  expiresAt: number
}

export type Vote = {
  playerId: string
  vote: boolean
}
