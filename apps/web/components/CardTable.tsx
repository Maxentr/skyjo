import { Card } from "@/components/Card"
import { useSkyjo } from "@/contexts/SkyjoContext"
import { canTurnTwoCards, isCurrentUserTurn } from "@/lib/skyjo"
import { cn } from "@/lib/utils"
import { SkyjoCardToJson } from "shared/types/skyjoCard"

type CardTableProps = {
  cards: SkyjoCardToJson[][]
  size?: "tiny" | "small" | "normal" | "big"
  cardDisabled?: boolean
  showSelectionAnimation?: boolean
}
const CardTable = ({
  cards,
  size = "normal",
  cardDisabled = false,
  showSelectionAnimation = false,
}: CardTableProps) => {
  const { game, player, actions } = useSkyjo()

  const canTurnCardAtBeginning =
    canTurnTwoCards(game) && game.roundState === "waitingPlayersToTurnTwoCards"
  const canReplaceCard =
    game.turnState === "throwOrReplace" || game.turnState === "replaceACard"
  const canTurnCard = game.turnState === "turnACard"

  const onClick = (column: number, row: number) => {
    if (canTurnCardAtBeginning) {
      actions.playRevealCard(column, row)
    } else if (isCurrentUserTurn(game, player.name)) {
      if (canReplaceCard) actions.replaceCard(column, row)
      else if (game.turnState === "turnACard" && !cards[column][row].isVisible)
        actions.turnCard(column, row)
    }
  }

  return (
    <div
      className={cn(
        "grid grid-rows-3 grid-flow-col transition-all duration-300 gap-2 w-fit h-full aspect-[31/32]",
        size === "tiny" ? "max-h-40" : "max-h-[208px]",
      )}
    >
      {cards.map((column, columnIndex) => {
        return column.map((card, rowIndex) => {
          const canBeSelected =
            ((canTurnCardAtBeginning || canTurnCard) && !card.isVisible) ||
            canReplaceCard
          return (
            <Card
              key={`${columnIndex}-${rowIndex}`}
              card={card}
              size={size}
              onClick={() => onClick(columnIndex, rowIndex)}
              className={
                showSelectionAnimation && canBeSelected
                  ? "animate-small-scale"
                  : ""
              }
              disabled={cardDisabled}
            />
          )
        })
      })}
    </div>
  )
}

export { CardTable }
