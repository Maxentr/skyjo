import type { UpdateGameSettings } from "../../validations/updateGameSettings.js"

export interface ClientToServerSettingsEvents {
  "game:reset-settings": () => void
  "game:settings": (settings: UpdateGameSettings) => void
  "game:settings:toggle-validation": () => void
}
