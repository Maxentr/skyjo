export class Constants {
  static readonly ERROR = {
    GAME_NOT_FOUND: "game-not-found",
    PLAYER_NOT_FOUND: "player-not-found",
    NOT_ALLOWED: "not-allowed",
    INVALID_TURN_STATE: "invalid-turn-state",
    TOO_FEW_PLAYERS: "too-few-players",
    CANNOT_RECONNECT: "cannot-reconnect",
    GAME_IS_FULL: "game-is-full",
    GAME_ALREADY_STARTED: "game-already-started",
    KICK_VOTE_IN_PROGRESS: "kick-vote-in-progress",
    NO_KICK_VOTE_IN_PROGRESS: "no-kick-vote-in-progress",
    PLAYER_ALREADY_VOTED: "player-already-voted",
  } as const
}
export type Error = (typeof Constants.ERROR)[keyof typeof Constants.ERROR]