export class Constants {
  static readonly MIN_PLAYERS = 2

  static readonly SKYJO_DEFAULT_SETTINGS = {
    MAX_PLAYERS: 8,
    ALLOW_SKYJO_FOR_COLUMN: true,
    ALLOW_SKYJO_FOR_ROW: false,
    SCORE_TO_END_GAME: 100,
    MULTIPLIER_FOR_FIRST_PLAYER: 2,
    CARDS: {
      PER_ROW: 3,
      PER_COLUMN: 4,
      INITIAL_TURNED_COUNT: 2,
    },
  } as const

  static readonly GAME_STATUS = {
    LOBBY: "lobby",
    PLAYING: "playing",
    FINISHED: "finished",
    STOPPED: "stopped",
  } as const

  static readonly ROUND_STATUS = {
    WAITING_PLAYERS_TO_TURN_INITIAL_CARDS: "waitingPlayersToTurnInitialCards",
    PLAYING: "playing",
    LAST_LAP: "lastLap",
    OVER: "over",
  } as const

  static readonly TURN_STATUS = {
    CHOOSE_A_PILE: "chooseAPile",
    THROW_OR_REPLACE: "throwOrReplace",
    TURN_A_CARD: "turnACard",
    REPLACE_A_CARD: "replaceACard",
  } as const

  static readonly LAST_TURN_STATUS = {
    PICK_FROM_DRAW_PILE: "pickFromDrawPile",
    PICK_FROM_DISCARD_PILE: "pickFromDiscardPile",
    THROW: "throw",
    REPLACE: "replace",
    TURN: "turn",
  } as const

  static readonly AVATARS = {
    BEE: "bee",
    CRAB: "crab",
    DOG: "dog",
    ELEPHANT: "elephant",
    FOX: "fox",
    FROG: "frog",
    KOALA: "koala",
    OCTOPUS: "octopus",
    PENGUIN: "penguin",
    TURTLE: "turtle",
    WHALE: "whale",
  } as const

  static readonly CONNECTION_STATUS = {
    CONNECTED: "connected",
    CONNECTION_LOST: "connection-lost",
    LEAVE: "leave",
    DISCONNECTED: "disconnected",
  } as const

  static readonly USER_MESSAGE_TYPE = "message" as const

  static readonly SYSTEM_MESSAGE_TYPE = {
    SYSTEM_MESSAGE: "system-message",
    WARN_SYSTEM_MESSAGE: "warn-system-message",
    ERROR_SYSTEM_MESSAGE: "error-system-message",
  } as const

  static readonly SERVER_MESSAGE_TYPE = {
    PLAYER_JOINED: "player-joined",
    PLAYER_RECONNECT: "player-reconnect",
    PLAYER_LEFT: "player-left",
  } as const

  static readonly SERVER_MESSAGE_TYPE_ARRAY = Object.values(
    Constants.SERVER_MESSAGE_TYPE,
  )

  static readonly KICK_VOTE_THRESHOLD = 0.6 // 60%

  static readonly KICK_VOTE_EXPIRATION_TIME = 30000 // 30 seconds
}

export type GameStatus =
  (typeof Constants.GAME_STATUS)[keyof typeof Constants.GAME_STATUS]
export type RoundStatus =
  (typeof Constants.ROUND_STATUS)[keyof typeof Constants.ROUND_STATUS]

export type TurnStatus =
  (typeof Constants.TURN_STATUS)[keyof typeof Constants.TURN_STATUS]
export type LastTurnStatus =
  (typeof Constants.LAST_TURN_STATUS)[keyof typeof Constants.LAST_TURN_STATUS]
export type Avatar = (typeof Constants.AVATARS)[keyof typeof Constants.AVATARS]
export type ConnectionStatus =
  (typeof Constants.CONNECTION_STATUS)[keyof typeof Constants.CONNECTION_STATUS]
export type UserMessageType = typeof Constants.USER_MESSAGE_TYPE
export type SystemMessageType =
  (typeof Constants.SYSTEM_MESSAGE_TYPE)[keyof typeof Constants.SYSTEM_MESSAGE_TYPE]

export type ServerMessageType =
  (typeof Constants.SERVER_MESSAGE_TYPE)[keyof typeof Constants.SERVER_MESSAGE_TYPE]
