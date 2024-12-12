import type {
  UpdateGameSettings,
  UpdateGameSettingsAllowSkyjoForColumn,
  UpdateGameSettingsAllowSkyjoForRow,
  UpdateGameSettingsCardPerColumn,
  UpdateGameSettingsCardPerRow,
  UpdateGameSettingsInitialTurnedCount,
  UpdateGameSettingsMultiplierForFirstPlayer,
  UpdateGameSettingsScoreToEndGame,
} from "../../validations/updateGameSettings.js"

export interface ClientToServerSettingsEvents {
  "game:settings": (settings: UpdateGameSettings) => void
  "game:settings:allow-skyjo-for-column": (
    allowSkyjoForColumn: UpdateGameSettingsAllowSkyjoForColumn,
  ) => void
  "game:settings:allow-skyjo-for-row": (
    allowSkyjoForRow: UpdateGameSettingsAllowSkyjoForRow,
  ) => void
  "game:settings:initial-turned-count": (
    initialTurnedCount: UpdateGameSettingsInitialTurnedCount,
  ) => void
  "game:settings:card-per-row": (
    cardPerRow: UpdateGameSettingsCardPerRow,
  ) => void
  "game:settings:card-per-column": (
    cardPerColumn: UpdateGameSettingsCardPerColumn,
  ) => void
  "game:settings:score-to-end-game": (
    scoreToEndGame: UpdateGameSettingsScoreToEndGame,
  ) => void
  "game:settings:multiplier-for-first-player": (
    multiplierForFirstPlayer: UpdateGameSettingsMultiplierForFirstPlayer,
  ) => void
}
