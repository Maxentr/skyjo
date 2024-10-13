import { ToastAction } from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"
import { useSkyjo } from "@/contexts/SkyjoContext"
import { useTranslations } from "next-intl"
import { KickVoteToJson, Vote } from "shared/types/kickVote"

export const useKickVoteToasts = () => {
  const { toast } = useToast()
  const { game, player } = useSkyjo()
  const t = useTranslations("components.KickVote")

  const showVoteInitiated = (playerToKickName: string) => {
    toast({
      title: t("vote-initiated.title"),
      description: t("vote-initiated.description", {
        playerName: playerToKickName,
      }),
      duration: 5000,
    })
  }

  const showVoteWithAction = (
    kickVote: KickVoteToJson,
    voteToKick: (id: string, vote: boolean) => void,
  ) => {
    const playerToKickName = getPlayerToKick(kickVote.targetId)?.name
    const initiatorName = getInitiator(kickVote.initiatorId)?.name
    toast({
      title: t("player-has-not-voted.title", {
        playerName: playerToKickName,
      }),
      description: t("player-has-not-voted.description", {
        initiatorName,
        playerName: playerToKickName,
      }),
      action: (
        <div className="flex flex-row items-center gap-2">
          <ToastAction
            onClick={() => voteToKick(kickVote.targetId, true)}
            altText={t("player-has-not-voted.kick-button.alt")}
          >
            {t("player-has-not-voted.kick-button.label")}
          </ToastAction>
          <ToastAction
            onClick={() => voteToKick(kickVote.targetId, false)}
            altText={t("player-has-not-voted.ignore-button.alt")}
            className="bg-gray-200"
          >
            {t("player-has-not-voted.ignore-button.label")}
          </ToastAction>
        </div>
      ),
      yesVotes: getYesVotes(kickVote.votes),
      requiredVotes: kickVote.requiredVotes,
      duration: 30000,
    })
  }
  const showVoteWithoutAction = (kickVote: KickVoteToJson) => {
    const vote = kickVote.votes.find((v) => v.playerId === player?.id)!.vote

    toast({
      title: t("player-has-voted.title", {
        playerName: getPlayerToKick(kickVote.targetId)?.name,
      }),
      description: t("player-has-voted.description", {
        vote: `${vote}`,
      }),
      yesVotes: getYesVotes(kickVote.votes),
      requiredVotes: kickVote.requiredVotes,
      duration: 30000, // 30 seconds to vote
    })
  }
  const showVoteAgainstYou = (kickVote: KickVoteToJson) => {
    toast({
      title: t("vote-against-you.title"),
      description: t("vote-against-you.description", {
        initiatorName: getInitiator(kickVote.initiatorId)?.name,
      }),
      yesVotes: getYesVotes(kickVote.votes),
      requiredVotes: kickVote.requiredVotes,
      duration: 12000,
    })
  }

  const showVoteFailed = (kickVote: KickVoteToJson) => {
    const playerToKickName = getPlayerToKick(kickVote.targetId)?.name
    toast({
      title: t("vote-failed.title", {
        playerName: playerToKickName,
      }),
      description: t("vote-failed.description", {
        playerName: playerToKickName,
      }),
      duration: 5000,
    })
  }
  const showVoteAgainstYouFailed = () => {
    toast({
      title: t("vote-against-you-failed.title"),
      description: t("vote-against-you-failed.description"),
      duration: 5000,
    })
  }

  const showVoteSucceeded = (kickVote: KickVoteToJson) => {
    const playerToKickName = getPlayerToKick(kickVote.targetId)?.name

    toast({
      title: t("vote-succeeded.title", { playerName: playerToKickName }),
      description: t("vote-succeeded.description", {
        playerName: playerToKickName,
      }),
      duration: 5000,
    })
  }
  const showVoteAgainstYouSucceeded = () => {
    toast({
      title: t("vote-against-you-succeeded.title"),
      description: t("vote-against-you-succeeded.description"),
      duration: 5000,
    })
  }

  //#region helpers
  const getPlayerToKick = (targetId: string) => {
    return game?.players.find((p) => p.id === targetId)
  }

  const getInitiator = (initiatorId: string) => {
    return game?.players.find((p) => p.id === initiatorId)
  }

  const getYesVotes = (votes: Vote[]) => {
    return votes.filter((v) => v.vote).length
  }
  //#endregion

  return {
    showVoteInitiated,
    showVoteWithAction,
    showVoteAgainstYou,
    showVoteWithoutAction,
    showVoteAgainstYouFailed,
    showVoteFailed,
    showVoteSucceeded,
    showVoteAgainstYouSucceeded,
  }
}
