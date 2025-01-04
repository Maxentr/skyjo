import { CardTable } from "@/components/CardTable"
import { useSettings } from "@/contexts/SettingsContext"
import { useSkyjo } from "@/contexts/SkyjoContext"
import { cn } from "@/lib/utils"
import { Constants as CoreConstants, SkyjoPlayerToJson } from "@skyjo/core"
import { useTranslations } from "next-intl"
import Image from "next/image"

type PlayerBoardProps = {
  player: SkyjoPlayerToJson
  isPlayerTurn: boolean
}

const PlayerBoard = ({ player, isPlayerTurn }: PlayerBoardProps) => {
  const { game } = useSkyjo()
  const { settings } = useSettings()
  const ta = useTranslations("utils.avatar")
  const tp = useTranslations("components.PlayerBoard")

  const showSelectionAnimation =
    game.roundPhase === CoreConstants.ROUND_PHASE.TURNING_INITIAL_CARDS ||
    (isPlayerTurn &&
      (game.turnStatus === CoreConstants.TURN_STATUS.TURN_A_CARD ||
        game.turnStatus === CoreConstants.TURN_STATUS.REPLACE_A_CARD ||
        game.turnStatus === CoreConstants.TURN_STATUS.THROW_OR_REPLACE))

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-end col-start-2 duration-300 ease-in-out w-full h-full",
      )}
    >
      <CardTable
        cards={player.cards}
        showSelectionAnimation={showSelectionAnimation}
        size={settings.gameBoardSize}
      />
      <Image
        src={`/avatars/${player.avatar}.svg`}
        width={32}
        height={32}
        alt={ta(player.avatar)}
        title={ta(player.avatar)}
        className={cn(
          "mt-4 select-none dark:opacity-75",
          isPlayerTurn && "animate-bounce",
        )}
        priority
      />
      <p
        className={cn(
          "text-center select-none text-sm text-black dark:text-dark-font",
          isPlayerTurn && "font-semibold",
        )}
      >
        {player.name} ({tp("you")})
      </p>
    </div>
  )
}

export default PlayerBoard
