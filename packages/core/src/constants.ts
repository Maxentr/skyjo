export class Constants {
  static readonly FIRST_PLAYER_PENALTY_TYPE = {
    MULTIPLIER_ONLY: 1,
    FLAT_ONLY: 2,
    FLAT_THEN_MULTIPLIER: 3,
    MULTIPLIER_THEN_FLAT: 4,
  } as const

  static readonly DEFAULT_GAME_SETTINGS = {
    MIN_PLAYERS: 2,
    MAX_PLAYERS: 8,
    ALLOW_SKYJO_FOR_COLUMN: true,
    ALLOW_SKYJO_FOR_ROW: false,
    SCORE_TO_END_GAME: 100,
    FIRST_PLAYER_MULTIPLIER_PENALTY: 2,
    FIRST_PLAYER_FLAT_PENALTY: 0,
    FIRST_PLAYER_PENALTY_TYPE:
      Constants.FIRST_PLAYER_PENALTY_TYPE.MULTIPLIER_ONLY,
    CARDS: {
      PER_ROW: 3,
      PER_COLUMN: 4,
      INITIAL_TURNED_COUNT: 2,
    },
  } as const

  static readonly GAME_STATUS = {
    LOBBY: 1,
    PLAYING: 2,
    FINISHED: 3,
    STOPPED: 4,
  } as const

  static readonly ROUND_STATUS = {
    WAITING_PLAYERS_TO_TURN_INITIAL_CARDS: 1,
    PLAYING: 2,
    LAST_LAP: 3,
    OVER: 4,
  } as const

  static readonly TURN_STATUS = {
    CHOOSE_A_PILE: 1,
    THROW_OR_REPLACE: 2,
    TURN_A_CARD: 3,
    REPLACE_A_CARD: 4,
  } as const

  static readonly LAST_TURN_STATUS = {
    PICK_FROM_DRAW_PILE: 1,
    PICK_FROM_DISCARD_PILE: 2,
    THROW: 3,
    REPLACE: 4,
    TURN: 5,
  } as const

  static readonly AVATARS = {
    BEE: "bee",
    CRAB: "crab",
    DOG: "dog",
    EAGLE: "eagle",
    ELEPHANT: "elephant",
    FOX: "fox",
    FROG: "frog",
    JELLYFISH: "jellyfish",
    KOALA: "koala",
    OCTOPUS: "octopus",
    PENGUIN: "penguin",
    TOUCAN: "toucan",
    TURTLE: "turtle",
    WHALE: "whale",
    OWL: "owl",
  } as const

  static readonly CONNECTION_STATUS = {
    CONNECTED: 1,
    CONNECTION_LOST: 2,
    LEAVE: 3,
    DISCONNECTED: 4,
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
    PLAYER_LEFT_CAN_RECONNECT: "player-left-can-reconnect",
    PLAYER_TIMEOUT: "player-timeout",
    PLAYER_TIMEOUT_CAN_RECONNECT: "player-timeout-can-reconnect",
    PLAYER_RECONNECTION_EXPIRED: "player-reconnection-expired",
    WIZZ: "wizz",
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

export type FirstPlayerPenaltyType =
  (typeof Constants.FIRST_PLAYER_PENALTY_TYPE)[keyof typeof Constants.FIRST_PLAYER_PENALTY_TYPE]
