import GameLobbyButtons from "@/components/GameLobbyButtons"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useSkyjo } from "@/contexts/SkyjoContext"
import { Constants as CoreConstants } from "@skyjo/core"
import { useTranslations } from "next-intl"

const GameStoppedDialog = () => {
  const { game } = useSkyjo()
  const t = useTranslations("components.GameStoppedDialog")

  const isGameStopped = game.status === CoreConstants.GAME_STATUS.STOPPED

  if (!isGameStopped) return null

  return (
    <Dialog open={isGameStopped}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-center">{t("title")}</DialogTitle>
          <DialogDescription className="mt-2 text-center">
            {t("description")}
          </DialogDescription>
        </DialogHeader>
        <GameLobbyButtons hideReconnectButton />
      </DialogContent>
    </Dialog>
  )
}

export default GameStoppedDialog
