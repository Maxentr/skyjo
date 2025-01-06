"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useSkyjo } from "@/contexts/SkyjoContext"
import { Constants as CoreConstants } from "@skyjo/core"
import { BookOpenIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

const GameRules = () => {
  const { game } = useSkyjo()
  const t = useTranslations("components.GameRules")

  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="icon"
        onClick={() => setOpen(!open)}
        className="mt-2"
        title={t("button-title")}
      >
        <BookOpenIcon />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-center">{t("title")}</DialogTitle>
          </DialogHeader>
          <DialogDescription></DialogDescription>
          <p>
            {t("allow-skyjo-for-column", {
              value: game?.settings.allowSkyjoForColumn,
            })}
          </p>
          <p>
            {t("allow-skyjo-for-row", {
              value: game?.settings.allowSkyjoForRow,
            })}
          </p>
          <p>{t("card-per-column", { value: game?.settings.cardPerColumn })}</p>
          <p>{t("card-per-row", { value: game?.settings.cardPerRow })}</p>
          <p>
            {t("initial-turned-count", {
              value: game?.settings.initialTurnedCount,
            })}
          </p>
          <p>
            {t("score-to-end-game", { value: game?.settings.scoreToEndGame })}
          </p>
          <p>
            {t("first-player-penalty-type.label")}
            {t(
              `first-player-penalty-type.${game?.settings.firstPlayerPenaltyType}`,
            )}
          </p>
          {game?.settings.firstPlayerPenaltyType !==
            CoreConstants.FIRST_PLAYER_PENALTY_TYPE.FLAT_ONLY && (
            <p>
              {t("first-player-multiplier-penalty", {
                value: game?.settings.firstPlayerMultiplierPenalty,
              })}
            </p>
          )}
          {game?.settings.firstPlayerPenaltyType !==
            CoreConstants.FIRST_PLAYER_PENALTY_TYPE.MULTIPLIER_ONLY && (
            <p>
              {t("first-player-flat-penalty", {
                value: game?.settings.firstPlayerFlatPenalty,
              })}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

export { GameRules }
