"use client"

import { Card } from "@/components/Card"
import SelectedCard from "@/components/SelectedCard"
import { useSkyjo } from "@/contexts/SkyjoContext"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import { LAST_TURN_STATUS, TURN_STATUS } from "shared/constants"

type DiscardPileProps = {
  isPlayerTurn: boolean
}

const DiscardPile = ({ isPlayerTurn }: DiscardPileProps) => {
  const { game, actions } = useSkyjo()
  const t = useTranslations("components.DiscardPile")

  const onClick = () => {
    if (
      isPlayerTurn &&
      game.lastDiscardCardValue !== undefined &&
      game.turnStatus === TURN_STATUS.CHOOSE_A_PILE
    )
      actions.pickCardFromPile("discard")
  }

  const onDiscard = () => {
    if (isPlayerTurn) actions.discardSelectedCard()
  }

  if (isPlayerTurn && game.turnStatus === TURN_STATUS.THROW_OR_REPLACE) {
    return (
      <Card
        card={{
          id: "discard",
          value: -98,
          isVisible: false,
        }}
        onClick={onDiscard}
        title={t(LAST_TURN_STATUS.THROW)}
        className="translate-y-1 animate-scale"
        disabled={false}
        flipAnimation={false}
      />
    )
  }

  const card = {
    id: "discard",
    value: game.lastDiscardCardValue ?? -99,
    isVisible: game.lastDiscardCardValue !== undefined,
  }

  const canDiscard =
    isPlayerTurn && game.turnStatus === TURN_STATUS.CHOOSE_A_PILE

  return (
    <div className="relative">
      <SelectedCard show={game.turnStatus === TURN_STATUS.REPLACE_A_CARD} />
      <Card
        card={card}
        onClick={onClick}
        title={t("title")}
        className={cn(
          card.value === -99 ? "translate-y-1" : "translate-y-[2.5px]",
          canDiscard ? "animate-scale" : "",
        )}
        disabled={!canDiscard}
        flipAnimation={false}
      />
    </div>
  )
}

export default DiscardPile
