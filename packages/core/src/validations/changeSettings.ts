import { z } from "zod"
import { Constants } from "../constants.js"

export const changeSettings = z
  .object({
    private: z.boolean(),
    allowSkyjoForColumn: z
      .boolean()
      .default(Constants.SKYJO_DEFAULT_SETTINGS.ALLOW_SKYJO_FOR_COLUMN),
    allowSkyjoForRow: z
      .boolean()
      .default(Constants.SKYJO_DEFAULT_SETTINGS.ALLOW_SKYJO_FOR_ROW),
    initialTurnedCount: z
      .number()
      .int()
      .min(0)
      .default(Constants.SKYJO_DEFAULT_SETTINGS.CARDS.INITIAL_TURNED_COUNT),
    cardPerRow: z
      .number()
      .int()
      .min(1)
      .max(Constants.SKYJO_DEFAULT_SETTINGS.CARDS.PER_ROW)
      .default(Constants.SKYJO_DEFAULT_SETTINGS.CARDS.PER_ROW),
    cardPerColumn: z
      .number()
      .int()
      .min(1)
      .max(Constants.SKYJO_DEFAULT_SETTINGS.CARDS.PER_COLUMN)
      .default(Constants.SKYJO_DEFAULT_SETTINGS.CARDS.PER_COLUMN),
    scoreToEndGame: z
      .number()
      .int()
      .min(1)
      .max(10000000)
      .default(Constants.SKYJO_DEFAULT_SETTINGS.SCORE_TO_END_GAME),
    multiplierForFirstPlayer: z
      .number()
      .int()
      .min(1)
      .max(10000000)
      .default(Constants.SKYJO_DEFAULT_SETTINGS.MULTIPLIER_FOR_FIRST_PLAYER),
  })
  .refine(
    (data) => data.initialTurnedCount < data.cardPerColumn * data.cardPerRow,
    {
      message:
        "The initial number of cards must be less than the total of cards",
    },
  )

export type ChangeSettings = z.infer<typeof changeSettings>
export type ChangeSettingsInput = z.input<typeof changeSettings>
