import OpponentBoard from "@/components/OpponentBoard"
import UserAvatar from "@/components/UserAvatar"
import { useSettings } from "@/contexts/SettingsContext"
import { useSkyjo } from "@/contexts/SkyjoContext"
import {
  getCurrentWhoHasToPlay,
  getNextPlayerIndex,
  isCurrentUserTurn,
} from "@/lib/skyjo"
import { Constants as CoreConstants } from "@skyjo/core"
import { AnimatePresence, m } from "framer-motion"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

const OpponentsMobileView = () => {
  const { opponents, game, player } = useSkyjo()
  const {
    settings: { switchToPlayerWhoIsPlaying },
  } = useSettings()
  const t = useTranslations("components.OpponentsMobileView")
  const flattenOpponents = opponents.flat()

  const [selectedOpponentIndex, setSelectedOpponentIndex] = useState(
    getNextPlayerIndex(game, player),
  )

  useEffect(() => {
    if (!switchToPlayerWhoIsPlaying) return

    const getCurrentPlayer = () => {
      const currentWhoHasToPlay = getCurrentWhoHasToPlay(game)

      const currentPlayerIndex = flattenOpponents.findIndex(
        (opponent) => opponent.id === currentWhoHasToPlay?.id,
      )

      return currentPlayerIndex
    }
    const setNewSelectedOpponentIndex = () => {
      const newSelectedOpponentIndex = isCurrentUserTurn(game, player)
        ? getNextPlayerIndex(game, player)
        : getCurrentPlayer()

      if (newSelectedOpponentIndex === -1) return

      setTimeout(() => {
        setSelectedOpponentIndex(newSelectedOpponentIndex)
      }, 1500)
    }

    setNewSelectedOpponentIndex()
  }, [
    switchToPlayerWhoIsPlaying,
    game.turn,
    game,
    player.id,
    selectedOpponentIndex,
    flattenOpponents,
  ])

  useEffect(() => {
    if (game.status === CoreConstants.GAME_STATUS.PLAYING) {
      const nextPlayerIndex = getNextPlayerIndex(game, player)
      if (nextPlayerIndex !== -1) setSelectedOpponentIndex(nextPlayerIndex)
    }
  }, [game.status])

  if (flattenOpponents.length === 0) return null

  const selectedOpponent = flattenOpponents[selectedOpponentIndex]
  const opponentsWithoutSelected = flattenOpponents.filter(
    (_, index) => index !== selectedOpponentIndex,
  )

  return (
    <AnimatePresence>
      <div className="flex lg:hidden flex-row grow">
        <div className="flex flex-col w-20 gap-2 max-h-52">
          {opponentsWithoutSelected.length > 0 && (
            <>
              <p className="text-nowrap text-black dark:text-dark-font">
                {t("opponents-list.title")}
              </p>
              {opponentsWithoutSelected.map((opponent, index) => (
                <m.button
                  key={opponent.id}
                  initial={{ opacity: 0, scale: 0.8, x: 50 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ display: "none", transition: { duration: 0 } }}
                  onClick={() => setSelectedOpponentIndex(index)}
                >
                  <UserAvatar player={opponent} size="small" />
                </m.button>
              ))}
            </>
          )}
        </div>
        <div className="flex grow justify-center items-center">
          {selectedOpponent && (
            <m.div
              key={selectedOpponent.id}
              initial={{ opacity: 0, scale: 0.8, x: -50 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ display: "none", transition: { duration: 0 } }}
            >
              <OpponentBoard
                opponent={selectedOpponent}
                isPlayerTurn={isCurrentUserTurn(game, selectedOpponent)}
                className="w-fit h-fit snap-center"
              />
            </m.div>
          )}
        </div>
        <div className="w-10"></div>
      </div>
    </AnimatePresence>
  )
}

export default OpponentsMobileView
