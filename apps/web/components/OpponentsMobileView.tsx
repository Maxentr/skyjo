import { Card } from "@/components/Card"
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
import { useEffect, useState } from "react"

const OpponentsMobileView = () => {
  const { opponents, game, player } = useSkyjo()
  const {
    settings: { switchToPlayerWhoIsPlaying },
  } = useSettings()
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
        <OpponentList
          opponents={flattenOpponents}
          selectedOpponentIndex={selectedOpponentIndex}
          setSelectedOpponentIndex={setSelectedOpponentIndex}
        />
        <div className="w-10" />
        <div className="flex grow justify-center items-start">
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
      </div>
    </AnimatePresence>
  )
}

type OpponentListProps = {
  opponents: SkyjoPlayerToJson[]
  selectedOpponentIndex: number
  setSelectedOpponentIndex: (index: number) => void
}
const OpponentList = ({
  opponents,
  selectedOpponentIndex,
  setSelectedOpponentIndex,
}: OpponentListProps) => {
  const { game } = useSkyjo()

  return (
    <div className="absolute flex flex-col w-20 gap-4 h-[calc(100svh-2rem)] pt-1 overflow-y-auto">
      {opponents.length > 1 &&
        opponents.map((opponent, index) => {
          const isSelected = index === selectedOpponentIndex
          const isPlayerWhoHasToPlay = isCurrentUserTurn(game, opponents[index])

          return (
            <OpponentItem
              key={opponent.id}
              opponent={opponent}
              index={index}
              isSelected={isSelected}
              isPlayerWhoHasToPlay={isPlayerWhoHasToPlay}
              setSelectedOpponentIndex={setSelectedOpponentIndex}
            />
          )
        })}
    </div>
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
  const {
    settings: { showPreviewOpponentsCardsForMobile },
  } = useSettings()

  return (
    <m.button
      key={opponent.id}
      initial={{ opacity: 0, scale: 0.8, x: 50 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ display: "none", transition: { duration: 0 } }}
      onClick={() => setSelectedOpponentIndex(index)}
      className={cn(
        "flex flex-col items-center",
        isSelected && "font-semibold",
      )}
    >
      <UserAvatar
        player={opponent}
        size="tiny"
        animate={isPlayerWhoHasToPlay}
      />
      {showPreviewOpponentsCardsForMobile && (
        <div className="flex flex-row gap-0.5">
          {opponent.cards.map((column, columnIndex) => (
            <div key={columnIndex} className="flex flex-col gap-0.5">
              {column.map((card) => (
                <Card
                  key={card.id}
                  card={card}
                  size="preview"
                  flipAnimation={false}
                  exitAnimation={false}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </m.button>
  )
}

export default OpponentsMobileView
