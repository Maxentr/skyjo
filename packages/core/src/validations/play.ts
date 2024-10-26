import { z } from "zod"

export const playGeneralWithCardIndex = z.object({
  column: z.number().int().min(0).max(3),
  row: z.number().int().min(0).max(2),
})

export const playRevealCard = playGeneralWithCardIndex
export type PlayRevealCard = z.infer<typeof playRevealCard>

export const playPickCard = z.object({
  pile: z.enum(["draw", "discard"]),
})
export type PlayPickCard = z.infer<typeof playPickCard>

export const playReplaceCard = playGeneralWithCardIndex
export type PlayReplaceCard = z.infer<typeof playReplaceCard>

export const playTurnCard = playGeneralWithCardIndex
export type PlayTurnCard = z.infer<typeof playTurnCard>
