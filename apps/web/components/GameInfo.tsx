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
      game.roundStatus === CoreConstants.ROUND_STATUS.TURNING_INITIAL_CARDS
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

    if (game.turnStatus === CoreConstants.TURN_STATUS.CHOOSE_A_PILE) {
      return t("turn.chooseAPile")
    }
    if (game.turnStatus === CoreConstants.TURN_STATUS.THROW_OR_REPLACE) {
      return t("turn.throwOrReplace")
    }
    if (game.turnStatus === CoreConstants.TURN_STATUS.TURN_A_CARD) {
      return t("turn.turnACard")
    }
    if (game.turnStatus === CoreConstants.TURN_STATUS.REPLACE_A_CARD) {
      return t("turn.replaceACard")
    }
  }

  return (
    <div className="absolute -top-6 sm:-top-8 lg:-top-11 text-center text-sm animate-scale flex flex-col items-center">
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
            CoreConstants.ROUND_STATUS.TURNING_INITIAL_CARDS ||
            game.roundStatus === CoreConstants.ROUND_STATUS.MAIN ||
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
