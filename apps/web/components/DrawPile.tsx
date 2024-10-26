"use client"

import { Card } from "@/components/Card"
import SelectedCard from "@/components/SelectedCard"
import { useSkyjo } from "@/contexts/SkyjoContext"
import { cn } from "@/lib/utils"
import { Constants as CoreConstants } from "@skyjo/core"
import { useTranslations } from "next-intl"

const DRAW_CARD = {
  id: "draw",
  value: undefined,
  isVisible: false,
}

type DrawPileProps = {
  isPlayerTurn: boolean
}

const DrawPile = ({ isPlayerTurn }: DrawPileProps) => {
  const { game, actions } = useSkyjo()
  const t = useTranslations("components.DrawPile")

  const onClick = () => {
    if (
      isPlayerTurn &&
      game.turnStatus === CoreConstants.TURN_STATUS.CHOOSE_A_PILE
    ) {
      actions.pickCardFromPile("draw")
    }
  }

  const canDrawCard =
    isPlayerTurn && game.turnStatus === CoreConstants.TURN_STATUS.CHOOSE_A_PILE
      ? "animate-scale"
      : ""

  return (
    <div className="relative">
      <SelectedCard
        show={game.turnStatus === CoreConstants.TURN_STATUS.THROW_OR_REPLACE}
      />
      <Card
        card={DRAW_CARD}
        onClick={onClick}
        title={t("title")}
        className={cn(
          "!shadow-[3px_3px_0px_0px_rgba(0,0,0)] !mdh:md:shadow-[4px_4px_0px_0px_rgba(0,0,0)]",
          canDrawCard,
        )}
        disabled={
          !(
            isPlayerTurn &&
            game.turnStatus === CoreConstants.TURN_STATUS.CHOOSE_A_PILE
          )
        }
        flipAnimation={false}
      />
    </div>
  )
}

export default DrawPile
