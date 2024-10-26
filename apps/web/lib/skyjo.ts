import { Opponents } from "@/types/opponents"
import {
  Constants as CoreConstants,
  SkyjoPlayerToJson,
  SkyjoToJson,
} from "@skyjo/core"

export const getCurrentUser = (
  players: SkyjoToJson["players"] | undefined,
  socketId: string,
) => {
  if (!players) {
    return undefined
  }

  return players.find((player) => player.socketId === socketId)
}

export const getConnectedPlayers = (
  players: SkyjoToJson["players"] | undefined,
) => {
  if (!players) {
    return []
  }

  return players.filter(
    (player) =>
      player.connectionStatus !== CoreConstants.CONNECTION_STATUS.DISCONNECTED,
  )
}

export const getOpponents = (
  players: SkyjoToJson["players"] | undefined,
  socketId: string,
): Opponents => {
  if (!players) {
    return [[], [], []]
  }

  const connectedPlayers = getConnectedPlayers(players)

  const playerIndex = connectedPlayers.findIndex(
    (player) => player.socketId === socketId,
  )

  const connectedOpponents = [
    ...connectedPlayers.slice(playerIndex + 1),
    ...connectedPlayers.slice(0, playerIndex),
  ]

  // if 2 players then [[], [player, player], []]
  // if 3 players then [[player], [player], [player]]
  // if 4 players then [[player], [player, player], [player]]
  // if 5 players then [[player], [player, player, player], [player]]
  // if 6 players then [[player], [player, player, player, player], [player]]
  // if 7 players then [[player], [player, player, player, player, player], [player]]

  if (connectedOpponents.length <= 2) {
    return [[], connectedOpponents, []]
  } else {
    const firstOpponent = connectedOpponents.shift()!
    const lastOpponent = connectedOpponents.pop()!

    return [[firstOpponent], connectedOpponents, [lastOpponent]]
  }
}

export const isCurrentUserTurn = (
  game?: SkyjoToJson,
  player?: SkyjoPlayerToJson,
) => {
  if (!player || !game) return false
  if (
    game.roundStatus ===
      CoreConstants.ROUND_STATUS.WAITING_PLAYERS_TO_TURN_INITIAL_CARDS &&
    game.status === CoreConstants.GAME_STATUS.PLAYING
  )
    return true

  if (
    game.status !== CoreConstants.GAME_STATUS.PLAYING ||
    game.roundStatus === CoreConstants.ROUND_STATUS.OVER
  )
    return false

  return game.players[game.turn].id === player.id
}

export const hasRevealedCardCount = (
  player: SkyjoPlayerToJson,
  count: number,
) => {
  const currentCount = player.cards
    .flat()
    .filter((card) => card.isVisible).length

  return currentCount === count
}

export const canTurnInitialCard = (game: SkyjoToJson) => {
  return (
    game.status === CoreConstants.GAME_STATUS.PLAYING &&
    game.roundStatus ===
      CoreConstants.ROUND_STATUS.WAITING_PLAYERS_TO_TURN_INITIAL_CARDS
  )
}

export const hasTurnedCard = (player: SkyjoPlayerToJson, count: number) => {
  const visibleCards = player.cards.flat().filter((card) => card.isVisible)

  return visibleCards.length === count
}

export const getWinner = (game: SkyjoToJson) => {
  const connectedPlayers = getConnectedPlayers(game.players)
  return connectedPlayers.reduce((prev, current) =>
    prev.score < current.score ? prev : current,
  )
}

export const getCurrentWhoHasToPlay = (game: SkyjoToJson) => {
  const players = getConnectedPlayers(game.players)

  return players.find((player) => player.id === game.players[game.turn].id)
}

export const getNextPlayerIndex = (
  game: SkyjoToJson,
  currentPlayer: SkyjoPlayerToJson,
): number => {
  const opponents = getOpponents(game.players, currentPlayer.socketId).flat()

  if (opponents.length === 0) {
    return -1
  }

  const currentTurnIndex = game.players.findIndex(
    (p) => p.id === game.players[game.turn].id,
  )

  let nextOpponentIndex = opponents.findIndex(
    (opponent) =>
      game.players.findIndex((p) => p.id === opponent.id) > currentTurnIndex,
  )

  if (nextOpponentIndex === -1) {
    nextOpponentIndex = 0
  }

  return nextOpponentIndex
}
