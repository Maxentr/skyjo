import { Constants as CoreConstants } from "@skyjo/core"
import { z } from "zod"

// Individual property schemas
export const updateGameSettingsPrivateSchema = z.boolean()
export type UpdateGameSettingsPrivate = z.infer<
  typeof updateGameSettingsPrivateSchema
>

export const updateGameSettingsAllowSkyjoForColumnSchema = z
  .boolean()
  .default(CoreConstants.SKYJO_DEFAULT_SETTINGS.ALLOW_SKYJO_FOR_COLUMN)
export type UpdateGameSettingsAllowSkyjoForColumn = z.infer<
  typeof updateGameSettingsAllowSkyjoForColumnSchema
>

export const updateGameSettingsAllowSkyjoForRowSchema = z
  .boolean()
  .default(CoreConstants.SKYJO_DEFAULT_SETTINGS.ALLOW_SKYJO_FOR_ROW)
export type UpdateGameSettingsAllowSkyjoForRow = z.infer<
  typeof updateGameSettingsAllowSkyjoForRowSchema
>

export const updateGameSettingsInitialTurnedCountSchema = z
  .number()
  .int()
  .min(0)
  .default(CoreConstants.SKYJO_DEFAULT_SETTINGS.CARDS.INITIAL_TURNED_COUNT)
export type UpdateGameSettingsInitialTurnedCount = z.infer<
  typeof updateGameSettingsInitialTurnedCountSchema
>

export const updateGameSettingsCardPerRowSchema = z
  .number()
  .int()
  .min(1)
  .max(CoreConstants.SKYJO_DEFAULT_SETTINGS.CARDS.PER_ROW)
  .default(CoreConstants.SKYJO_DEFAULT_SETTINGS.CARDS.PER_ROW)
export type UpdateGameSettingsCardPerRow = z.infer<
  typeof updateGameSettingsCardPerRowSchema
>

export const updateGameSettingsCardPerColumnSchema = z
  .number()
  .int()
  .min(1)
  .max(CoreConstants.SKYJO_DEFAULT_SETTINGS.CARDS.PER_COLUMN)
  .default(CoreConstants.SKYJO_DEFAULT_SETTINGS.CARDS.PER_COLUMN)
export type UpdateGameSettingsCardPerColumn = z.infer<
  typeof updateGameSettingsCardPerColumnSchema
>

export const updateGameSettingsScoreToEndGameSchema = z
  .number()
  .int()
  .min(1)
  .max(10000000)
  .default(CoreConstants.SKYJO_DEFAULT_SETTINGS.SCORE_TO_END_GAME)
export type UpdateGameSettingsScoreToEndGame = z.infer<
  typeof updateGameSettingsScoreToEndGameSchema
>

export const updateGameSettingsMultiplierForFirstPlayerSchema = z
  .number()
  .int()
  .min(1)
  .max(10000000)
  .default(CoreConstants.SKYJO_DEFAULT_SETTINGS.MULTIPLIER_FOR_FIRST_PLAYER)
export type UpdateGameSettingsMultiplierForFirstPlayer = z.infer<
  typeof updateGameSettingsMultiplierForFirstPlayerSchema
>

export const updateGameSettingsSchema = z.object({
  private: updateGameSettingsPrivateSchema,
  allowSkyjoForColumn: updateGameSettingsAllowSkyjoForColumnSchema,
  allowSkyjoForRow: updateGameSettingsAllowSkyjoForRowSchema,
  initialTurnedCount: updateGameSettingsInitialTurnedCountSchema,
  cardPerRow: updateGameSettingsCardPerRowSchema,
  cardPerColumn: updateGameSettingsCardPerColumnSchema,
  scoreToEndGame: updateGameSettingsScoreToEndGameSchema,
  multiplierForFirstPlayer: updateGameSettingsMultiplierForFirstPlayerSchema,
})

export type GameSettings = z.infer<typeof updateGameSettingsSchema>
export type UpdateGameSettings = z.input<typeof updateGameSettingsSchema>
