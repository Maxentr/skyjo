import {
  type Avatar,
  type ConnectionStatus,
  Constants,
  type GameStatus,
  type LastTurnStatus,
  type RoundStatus,
  type SkyjoCardDb,
  type SkyjoPlayerScores,
  type TurnStatus,
} from "@skyjo/core"
import {
  boolean,
  integer,
  json,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core"

const gameStatusEnum = pgEnum(
  "game_status",
  Object.values(Constants.GAME_STATUS) as [string],
)

const roundStatusEnum = pgEnum(
  "round_status",
  Object.values(Constants.ROUND_STATUS) as [string],
)

const turnStatusEnum = pgEnum(
  "turn_status",
  Object.values(Constants.TURN_STATUS) as [string],
)

const lastTurnStatusEnum = pgEnum(
  "last_turn_status",
  Object.values(Constants.LAST_TURN_STATUS) as [string],
)

const avatarEnum = pgEnum(
  "avatar",
  Object.values(Constants.AVATARS) as [string],
)

const connectionStatusEnum = pgEnum(
  "connection_status",
  Object.values(Constants.CONNECTION_STATUS) as [string],
)

const regionEnum = pgEnum("region", ["FR", "LOCAL"])

export const gameTable = pgTable("games", {
  id: uuid("id").primaryKey(),
  code: varchar("code", { length: 8 }).notNull().unique(),
  status: gameStatusEnum("status").$type<GameStatus>().notNull(),
  turn: integer("turn").notNull(),
  turnStatus: turnStatusEnum("turn_status").$type<TurnStatus>().notNull(),
  lastTurnStatus: lastTurnStatusEnum("last_turn_status")
    .$type<LastTurnStatus>()
    .notNull(),
  roundStatus: roundStatusEnum("round_status").$type<RoundStatus>().notNull(),
  roundNumber: integer("round_number").notNull(),
  discardPile: integer("discard_pile").array().notNull(),
  drawPile: integer("draw_pile").array().notNull(),
  selectedCardValue: integer("selected_card_value"),
  lastDiscardCardValue: integer("last_discard_card_value"),

  adminId: uuid("admin_id").notNull(),
  firstToFinishPlayerId: uuid("first_to_finish_player_id"),

  // settings
  allowSkyjoForColumn: boolean("allow_skyjo_for_column")
    .notNull()
    .default(Constants.SKYJO_DEFAULT_SETTINGS.ALLOW_SKYJO_FOR_COLUMN),
  allowSkyjoForRow: boolean("allow_skyjo_for_row")
    .notNull()
    .default(Constants.SKYJO_DEFAULT_SETTINGS.ALLOW_SKYJO_FOR_ROW),
  initialTurnedCount: integer("initial_turned_count")
    .notNull()
    .default(Constants.SKYJO_DEFAULT_SETTINGS.CARDS.INITIAL_TURNED_COUNT),
  cardPerRow: integer("card_per_row")
    .notNull()
    .default(Constants.SKYJO_DEFAULT_SETTINGS.CARDS.PER_ROW),
  cardPerColumn: integer("card_per_column")
    .notNull()
    .default(Constants.SKYJO_DEFAULT_SETTINGS.CARDS.PER_COLUMN),
  scoreToEndGame: integer("score_to_end_game")
    .notNull()
    .default(Constants.SKYJO_DEFAULT_SETTINGS.SCORE_TO_END_GAME),
  multiplierForFirstPlayer: integer("multiplier_for_first_player")
    .notNull()
    .default(Constants.SKYJO_DEFAULT_SETTINGS.MULTIPLIER_FOR_FIRST_PLAYER),
  maxPlayers: integer("max_players")
    .notNull()
    .default(Constants.SKYJO_DEFAULT_SETTINGS.MAX_PLAYERS),
  isPrivate: boolean("is_private").notNull(),

  region: regionEnum("regions").notNull(),

  // computed
  isFull: boolean("is_full").notNull(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
})

export const playerTable = pgTable("players", {
  id: uuid("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  socketId: varchar("socket_id", { length: 255 }).notNull(),
  avatar: avatarEnum("avatar").$type<Avatar>().notNull(),
  score: integer("score").notNull(),
  wantsReplay: boolean("wants_replay").notNull(),
  connectionStatus: connectionStatusEnum("connection_status")
    .$type<ConnectionStatus>()
    .notNull(),
  cards: json("cards").$type<SkyjoCardDb[][]>().notNull(),
  scores: json("scores").$type<SkyjoPlayerScores>().notNull(),
  disconnectionDate: timestamp("disconnection_date"),

  gameId: uuid("game_id")
    .references(() => gameTable.id, {
      onDelete: "cascade",
    })
    .notNull(),
})

export type DbGame = typeof gameTable.$inferSelect
export type DbPlayer = typeof playerTable.$inferSelect
