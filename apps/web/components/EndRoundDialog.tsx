import ScoreTable from "@/components/ScoreTable"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useSkyjo } from "@/contexts/SkyjoContext"
import { DialogDescription } from "@radix-ui/react-dialog"
import { Constants as CoreConstants } from "@skyjo/core"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

const EndRoundDialog = () => {
  const { game } = useSkyjo()
  const t = useTranslations("components.EndRoundDialog")

  const [open, setOpen] = useState(false)

  const isRoundOver =
    game.roundPhase === CoreConstants.ROUND_PHASE.OVER &&
    game.status === CoreConstants.GAME_STATUS.PLAYING

  useEffect(() => {
    setTimeout(() => {
      setOpen(isRoundOver)
    }, 1400)
  }, [isRoundOver])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center">{t("title")}</DialogTitle>
          <DialogDescription className="mt-2 text-center">
            {t("description")}
          </DialogDescription>
        </DialogHeader>
        <ScoreTable players={game.players} scrollToEnd />
      </DialogContent>
    </Dialog>
  )
}

export default EndRoundDialog
