import { useToast } from "@/components/ui/use-toast"
import { useSkyjo } from "@/contexts/SkyjoContext"
import { useSocket } from "@/contexts/SocketContext"
import { useKickVoteToasts } from "@/hooks/useKickVoteToasts"
import { useRouter } from "@/i18n/routing"
import { KickVoteToJson } from "@skyjo/core"
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

type VoteKickContext = {
  actions: {
    initiateKickVote: (targetPlayerId: string) => void
    voteToKick: (vote: boolean) => void
  }
  kickVoteInProgress: boolean
}

const VoteKickContext = createContext<VoteKickContext | undefined>(undefined)

export const VoteKickProvider = ({ children }: PropsWithChildren) => {
  const { socket } = useSocket()
  const { game, player } = useSkyjo()
  const { dismiss } = useToast()
  const router = useRouter()
  const {
    showVoteInitiated,
    showVoteWithAction,
    showVoteAgainstYou,
    showVoteWithoutAction,
    showVoteAgainstYouFailed,
    showVoteFailed,
    showVoteSucceeded,
    showVoteAgainstYouSucceeded,
  } = useKickVoteToasts()

  const [kickVoteInProgress, setKickVoteInProgress] = useState(false)

  useEffect(() => {
    if (!game || !socket) return

    initKickVoteListeners()

    return destroyKickVoteListeners
  }, [socket, game])

  //#region listeners
  const onKickVote = (kickVote: KickVoteToJson) => {
    setKickVoteInProgress(true)

    const isPlayerToKick = kickVote.targetId === player.id
    const hasVoted = kickVote.votes.find((v) => v.playerId === player.id)

    if (isPlayerToKick) showVoteAgainstYou(kickVote)
    else if (hasVoted) showVoteWithoutAction(kickVote)
    else showVoteWithAction(kickVote, voteToKick)
  }

  const onKickVoteFailed = (kickVote: KickVoteToJson) => {
    setKickVoteInProgress(false)

    const isPlayerToKick = kickVote.targetId === player.id

    if (isPlayerToKick) showVoteAgainstYouFailed()
    else showVoteFailed(kickVote)
  }

  const onKickVoteSuccess = (kickVote: KickVoteToJson) => {
    setKickVoteInProgress(false)

    const isPlayerToKick = kickVote.targetId === player.id

    if (isPlayerToKick) {
      showVoteAgainstYouSucceeded()
      router.replace("/")
    } else showVoteSucceeded(kickVote)
  }

  const initKickVoteListeners = () => {
    socket!.on("kick:vote", onKickVote)
    socket!.on("kick:vote-success", onKickVoteSuccess)
    socket!.on("kick:vote-failed", onKickVoteFailed)
  }

  const destroyKickVoteListeners = () => {
    socket!.off("kick:vote", onKickVote)
    socket!.off("kick:vote-success", onKickVoteSuccess)
    socket!.off("kick:vote-failed", onKickVoteFailed)
  }
  //#endregion

  //#region actions
  const initiateKickVote = (targetId: string) => {
    setKickVoteInProgress(true)

    socket!.emit("kick:initiate-vote", { targetId })
    const playerToKick = game?.players.find((p) => p.socketId === targetId)
    if (!playerToKick) return

    showVoteInitiated(playerToKick.name)
  }

  const voteToKick = (vote: boolean) => {
    socket!.emit("kick:vote", { vote })
    if (!vote) dismiss()
  }

  const actions = {
    initiateKickVote,
    voteToKick,
  }
  //#endregion

  const providerValue = useMemo(() => ({ kickVoteInProgress, actions }), [])

  return (
    <VoteKickContext.Provider value={providerValue}>
      {children}
    </VoteKickContext.Provider>
  )
}

export const useVoteKick = () => {
  const context = useContext(VoteKickContext)
  if (context === undefined) {
    throw new Error("useVoteKick must be used within a VoteKickProvider")
  }
  return context
}
