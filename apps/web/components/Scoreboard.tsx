"use client"

import ScoreDialog from "@/components/ScoreDialog"
import { Button } from "@/components/ui/button"
import { useSkyjo } from "@/contexts/SkyjoContext"
import { Constants as CoreConstants } from "@skyjo/core"
import { TrophyIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

const Scoreboard = () => {
  const { game } = useSkyjo()
  const t = useTranslations("components.Scoreboard")

  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="icon"
        onClick={() => setOpen(!open)}
        title={t("button-title")}
        tabIndex={game?.status === CoreConstants.GAME_STATUS.LOBBY ? -1 : 0}
      >
        <TrophyIcon />
      </Button>

      <ScoreDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

export default Scoreboard
