import type {
  ConnectionStatus,
  GameStatus,
  LastTurnStatus,
  RoundStatus,
  SkyjoCardToJson,
  SkyjoPlayerScores,
  SkyjoPlayerToJson,
  SkyjoSettingsToJson,
  TurnStatus,
} from "@skyjo/core"

export type PlayerOperationValue<T> = { playerId: string; value: T }

export type PlayerOperation =
  | ["player:socketId", PlayerOperationValue<string>]
  | ["player:cards", PlayerOperationValue<SkyjoCardToJson[][]>]
  | ["player:score", PlayerOperationValue<number>]
  | ["player:scores", PlayerOperationValue<SkyjoPlayerScores>]
  | ["player:connectionStatus", PlayerOperationValue<ConnectionStatus>]
  | ["player:wantsReplay", PlayerOperationValue<boolean>]
  | ["player:add", SkyjoPlayerToJson]
  | ["player:remove", string]

export type SkyjoOperation =
  | ["status", GameStatus]
  | ["adminId", string]
  | ["turn", number]
  | ["roundStatus", RoundStatus]
  | ["turnStatus", TurnStatus]
  | ["lastTurnStatus", LastTurnStatus]
  | ["selectedCardValue", number | null]
  | ["lastDiscardCardValue", number | undefined]
  | ["updatedAt", Date]
  | ["settings", Partial<SkyjoSettingsToJson>]
  | PlayerOperation
