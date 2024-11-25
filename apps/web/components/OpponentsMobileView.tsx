import OpponentBoard from "@/components/OpponentBoard"
import { UserAvatar } from "@/components/UserAvatar"
import { useSettings } from "@/contexts/SettingsContext"
import { useSkyjo } from "@/contexts/SkyjoContext"
import {
  getCurrentWhoHasToPlay,
  getNextPlayerIndex,
  isCurrentUserTurn,
} from "@/lib/skyjo"
import { cn } from "@/lib/utils"
import { Constants as CoreConstants, SkyjoPlayerToJson } from "@skyjo/core"
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
  }, [switchToPlayerWhoIsPlaying, game.turn, game.players])

  useEffect(() => {
    if (game.status === CoreConstants.GAME_STATUS.PLAYING) {
      const nextPlayerIndex = getNextPlayerIndex(game, player)
      if (nextPlayerIndex !== -1) setSelectedOpponentIndex(nextPlayerIndex)
    }
  }, [game.status])

  if (flattenOpponents.length === 0) return null

  const selectedOpponent = flattenOpponents[selectedOpponentIndex]

  return (
    <AnimatePresence>
      <div className="flex lg:hidden flex-row grow">
        <div className="flex flex-col w-20 gap-2 max-h-52">
          {flattenOpponents.length > 1 && (
            <>
              <p className="text-nowrap text-black dark:text-dark-font">
                {t("opponents-list.title")}
              </p>
              {flattenOpponents.map((opponent, index) => {
                const isSelected = index === selectedOpponentIndex
                const isPlayerWhoHasToPlay = isCurrentUserTurn(
                  game,
                  flattenOpponents[index],
                )

                return (
                  <OpponentItem
                    opponent={opponent}
                    index={index}
                    isSelected={isSelected}
                    isPlayerWhoHasToPlay={isPlayerWhoHasToPlay}
                    setSelectedOpponentIndex={setSelectedOpponentIndex}
                  />
                )
              })}
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

type OpponentItemProps = {
  opponent: SkyjoPlayerToJson
  index: number
  isSelected: boolean
  isPlayerWhoHasToPlay: boolean
  setSelectedOpponentIndex: (index: number) => void
}
const OpponentItem = ({
  opponent,
  index,
  isSelected,
  isPlayerWhoHasToPlay,
  setSelectedOpponentIndex,
}: OpponentItemProps) => {
  return (
    <m.button
      key={opponent.id}
      initial={{ opacity: 0, scale: 0.8, x: 50 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ display: "none", transition: { duration: 0 } }}
      onClick={() => setSelectedOpponentIndex(index)}
      className={cn(isSelected && "font-semibold")}
    >
      <UserAvatar
        player={opponent}
        size="small"
        animate={isPlayerWhoHasToPlay}
      />
    </m.button>
  )
}

export default OpponentsMobileView
