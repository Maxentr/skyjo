import { Card } from "@/components/Card"
import { GameBoardSize } from "@/contexts/SettingsContext"
import { useSkyjo } from "@/contexts/SkyjoContext"
import {
  canTurnInitialCard,
  hasTurnedCard,
  isCurrentUserTurn,
} from "@/lib/skyjo"
import { cn } from "@/lib/utils"
import { Constants as CoreConstants, SkyjoCardToJson } from "@skyjo/core"
import { cva } from "class-variance-authority"
import { AnimatePresence, m } from "framer-motion"
import { useEffect, useState } from "react"

const cardTableVariants = cva("inline-grid grid-flow-col duration-100 w-fit", {
  variants: {
    size: {
      normal: "gap-1 smh:gap-2",
      big: "gap-2 smh:gap-4",
    },
  },
})

type CardTableProps = {
  cards: SkyjoCardToJson[][]
  cardDisabled?: boolean
  showSelectionAnimation?: boolean
  size?: GameBoardSize
}
const CardTable = ({
  cards,
  cardDisabled = false,
  showSelectionAnimation = false,
  size = GameBoardSize.NORMAL,
}: CardTableProps) => {
  const { game, player, actions } = useSkyjo()
  const numberOfRows = cards?.[0]?.length
  const [numberOfRowsForClass, setNumberOfRowsForClass] = useState<number>(
    game.settings.cardPerRow,
  )

  const canTurnCardsAtBeginning =
    canTurnInitialCard(game) &&
    !hasTurnedCard(player, game.settings.initialTurnedCount)
  const canReplaceCard =
    game.turnStatus === CoreConstants.TURN_STATUS.THROW_OR_REPLACE ||
    game.turnStatus === CoreConstants.TURN_STATUS.REPLACE_A_CARD
  const canTurnCard = game.turnStatus === CoreConstants.TURN_STATUS.TURN_A_CARD

  const onClick = (column: number, row: number) => {
    if (canTurnCardsAtBeginning) {
      actions.playRevealCard(column, row)
    } else if (isCurrentUserTurn(game, player)) {
      if (canReplaceCard) actions.replaceCard(column, row)
      else if (
        game.turnStatus === CoreConstants.TURN_STATUS.TURN_A_CARD &&
        !cards[column][row].isVisible
      )
        actions.turnCard(column, row)
    }
  }

  // wait 2 seconds to set the number of rows (it's the time it takes for the animation to finish)
  useEffect(() => {
    if (numberOfRows === game.settings.cardPerRow)
      setNumberOfRowsForClass(game.settings.cardPerRow)
    setTimeout(() => {
      setNumberOfRowsForClass(numberOfRows)
    }, 1900)
  }, [numberOfRows, game.settings.cardPerRow])

  return (
    <m.div
      key={numberOfRowsForClass}
      initial={{ opacity: 0.9 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0.9 }}
      transition={{ duration: 0.3 }}
      className={cn(
        cardTableVariants({ size }),
        numberOfRowsForClass
          ? `grid-rows-${numberOfRowsForClass}`
          : "grid-rows-3",
      )}
    >
      <AnimatePresence>
        {cards.map((column, columnIndex) => {
          return column.map((card, rowIndex) => {
            const canBeSelected =
              ((canTurnCardsAtBeginning || canTurnCard) && !card.isVisible) ||
              canReplaceCard
            return (
              <Card
                key={card.id}
                card={card}
                onClick={() => onClick(columnIndex, rowIndex)}
                className={
                  showSelectionAnimation && canBeSelected
                    ? "animate-small-scale"
                    : ""
                }
                size={size}
                disabled={cardDisabled || !canBeSelected}
                flipAnimation={
                  game?.lastTurnStatus === CoreConstants.LAST_TURN_STATUS.TURN
                }
                exitAnimation={
                  game.roundPhase === CoreConstants.ROUND_PHASE.MAIN ||
                  game.roundPhase === CoreConstants.ROUND_PHASE.LAST_LAP
                }
              />
            )
          })
        })}
      </AnimatePresence>
    </m.div>
  )
}

export { CardTable }
