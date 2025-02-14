import { Constants as CoreConstants } from "@skyjo/core"
import { z } from "zod"

export const updateMaxPlayersSchema = z
  .number()
  .int()
  .min(CoreConstants.DEFAULT_GAME_SETTINGS.MIN_PLAYERS)
  .max(CoreConstants.DEFAULT_GAME_SETTINGS.MAX_PLAYERS)

export type UpdateMaxPlayers = z.input<typeof updateMaxPlayersSchema>

export const updateGameSettingsSchema = z.object({
  allowSkyjoForColumn: z.boolean().optional(),
  allowSkyjoForRow: z.boolean().optional(),
  initialTurnedCount: z.number().int().min(0).optional(),
  cardPerRow: z
    .number()
    .int()
    .min(1)
    .max(CoreConstants.DEFAULT_GAME_SETTINGS.CARDS.PER_ROW)
    .optional(),
  cardPerColumn: z
    .number()
    .int()
    .min(1)
    .max(CoreConstants.DEFAULT_GAME_SETTINGS.CARDS.PER_COLUMN)
    .optional(),
  scoreToEndGame: z.number().int().min(1).max(10000000).optional(),
  firstPlayerMultiplierPenalty: z
    .number()
    .int()
    .min(1)
    .max(10000000)
    .optional(),
  firstPlayerFlatPenalty: z.number().int().min(0).max(10000000).optional(),
  firstPlayerPenaltyType: z
    .nativeEnum(CoreConstants.FIRST_PLAYER_PENALTY_TYPE)
    .optional(),
})

export type UpdateGameSettings = z.input<typeof updateGameSettingsSchema>
