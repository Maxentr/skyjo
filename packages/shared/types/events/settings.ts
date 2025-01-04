import type {
  UpdateGameSettings,
  UpdateMaxPlayers,
} from "../../validations/updateGameSettings.js"

export interface ClientToServerSettingsEvents {
  "game:reset-settings": () => void
  "game:update-max-players": (maxPlayers: UpdateMaxPlayers) => void
  "game:update-settings": (settings: UpdateGameSettings) => void
  "game:settings:toggle-validation": () => void
}
