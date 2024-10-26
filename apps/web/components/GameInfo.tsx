"use client"

import { useSkyjo } from "@/contexts/SkyjoContext"
import { hasRevealedCardCount, isCurrentUserTurn } from "@/lib/skyjo"
import { Constants as CoreConstants } from "@skyjo/core"
import { AnimatePresence, m } from "framer-motion"
import { useTranslations } from "next-intl"

const GameInfo = () => {
  const { game, player, opponents } = useSkyjo()
  const t = useTranslations("utils.skyjo")

  const isPlayerTurn = isCurrentUserTurn(game, player)

  const getGameInfo = () => {
    if (!player || !game) return t("waiting")

    if (
      game.status === CoreConstants.GAME_STATUS.PLAYING &&
      game.roundStatus ===
        CoreConstants.ROUND_STATUS.WAITING_PLAYERS_TO_TURN_INITIAL_CARDS
    ) {
      if (hasRevealedCardCount(player, game.settings.initialTurnedCount)) {
        return t("waiting-opponents-to-turn-cards", {
          nbOpponents: opponents.flat().length,
          number: game.settings.initialTurnedCount,
        })
      } else {
        return t("turn-cards", {
          number: game.settings.initialTurnedCount,
        })
      }
    }

    return t(`turn.${game.turnStatus}`)
  }

  return (
    <div className="absolute -top-8 sm:-top-11 text-center text-sm animate-scale flex flex-col items-center">
      <AnimatePresence>
        {game.roundStatus === CoreConstants.ROUND_STATUS.LAST_LAP && (
          <m.p
            key="game-info-last-turn"
            initial={{
              scale: 0,
            }}
            animate={{
              scale: 1,
              transition: {
                duration: 0.3,
                ease: "easeInOut",
              },
            }}
            exit={{
              scale: 0,
              transition: {
                duration: 0.5,
                ease: "easeInOut",
              },
            }}
            className="text-sm text-black dark:text-dark-font"
          >
            {t("last-turn")}
          </m.p>
        )}
        {isPlayerTurn &&
          (game.roundStatus ===
            CoreConstants.ROUND_STATUS.WAITING_PLAYERS_TO_TURN_INITIAL_CARDS ||
            game.roundStatus === CoreConstants.ROUND_STATUS.PLAYING ||
            game.roundStatus === CoreConstants.ROUND_STATUS.LAST_LAP) && (
            <m.p
              key="game-info-text"
              className="text-nowrap text-sm text-black dark:text-dark-font"
              initial={{
                scale: 0,
              }}
              animate={{
                scale: 1,
                transition: {
                  duration: 0.3,
                  ease: "easeInOut",
                },
              }}
              exit={{
                scale: 0,
                transition: {
                  duration: 0.5,
                  ease: "easeInOut",
                },
              }}
            >
              {getGameInfo()}
            </m.p>
          )}
      </AnimatePresence>
    </div>
  )
}

export default GameInfo
