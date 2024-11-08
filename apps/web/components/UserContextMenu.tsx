import {
  ContextMenuContent,
  ContextMenuItem,
} from "@/components/ui/context-menu"
import { useChat } from "@/contexts/ChatContext"
import { useSkyjo } from "@/contexts/SkyjoContext"
import { useVoteKick } from "@/contexts/VoteKickContext"
import { SkyjoPlayerToJson } from "@skyjo/core"
import {
  MessageSquareIcon,
  MessageSquareOffIcon,
  UserRoundXIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"

const UserContextMenu = ({ player }: { player: SkyjoPlayerToJson }) => {
  const { unmutePlayer, mutePlayer, mutedPlayers } = useChat()
  const { actions, kickVoteInProgress } = useVoteKick()
  const { game } = useSkyjo()
  const t = useTranslations("components.Avatar")

  const handleKickPlayer = () => {
    if (hasLessThanThreePlayers || kickVoteInProgress) return

    actions.initiateKickVote(player.id)
  }

  const hasLessThanThreePlayers = game.players.length <= 2

  return (
    <ContextMenuContent>
      <ContextMenuItem
        onClick={handleKickPlayer}
        disabled={kickVoteInProgress || hasLessThanThreePlayers}
      >
        <UserRoundXIcon className="w-4 h-4 mr-2" />
        {t("context-menu.kick")}
      </ContextMenuItem>
      {mutedPlayers.includes(player.name) ? (
        <ContextMenuItem onClick={() => unmutePlayer(player.name)}>
          <MessageSquareIcon className="w-4 h-4 mr-2" />
          {t("context-menu.unmute")}
        </ContextMenuItem>
      ) : (
        <ContextMenuItem onClick={() => mutePlayer(player.name)}>
          <MessageSquareOffIcon className="w-4 h-4 mr-2" />
          {t("context-menu.mute")}
        </ContextMenuItem>
      )}
    </ContextMenuContent>
  )
}

export { UserContextMenu }
