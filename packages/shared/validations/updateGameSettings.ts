import { Constants as CoreConstants } from "@skyjo/core"
import { z } from "zod"

export const updateGameSettingsSchema = z.object({
  maxPlayers: z
    .number()
    .int()
    .min(CoreConstants.SKYJO_DEFAULT_SETTINGS.MIN_PLAYERS)
    .max(CoreConstants.SKYJO_DEFAULT_SETTINGS.MAX_PLAYERS)
    .optional(),
  allowSkyjoForColumn: z.boolean().optional(),
  allowSkyjoForRow: z.boolean().optional(),
  initialTurnedCount: z.number().int().min(0).optional(),
  cardPerRow: z
    .number()
    .int()
    .min(1)
    .max(CoreConstants.SKYJO_DEFAULT_SETTINGS.CARDS.PER_ROW)
    .optional(),
  cardPerColumn: z
    .number()
    .int()
    .min(1)
    .max(CoreConstants.SKYJO_DEFAULT_SETTINGS.CARDS.PER_COLUMN)
    .optional(),
  scoreToEndGame: z.number().int().min(1).max(10000000).optional(),
  firstPlayerScorePenaltyMultiplier: z
    .number()
    .int()
    .min(1)
    .max(10000000)
    .optional(),
})

export type UpdateGameSettings = z.input<typeof updateGameSettingsSchema>
