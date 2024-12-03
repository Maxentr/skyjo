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
            {t("multiplier-for-first-player", {
              value: game?.settings.multiplierForFirstPlayer,
            })}
          </p>
          <p>
            {t("score-to-end-game", { value: game?.settings.scoreToEndGame })}
          </p>
        </DialogContent>
      </Dialog>
    </>
  )
}

export { GameRules }
