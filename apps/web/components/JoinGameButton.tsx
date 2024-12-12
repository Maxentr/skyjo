"use client"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useSocket } from "@/contexts/SocketContext"
import { useUser } from "@/contexts/UserContext"
import { useRouter } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import { Constants as CoreConstants, GameStatus } from "@skyjo/core"
import { Constants as ErrorConstants } from "@skyjo/error"
import { ErrorJoinMessage } from "@skyjo/shared/types"
import { ClassValue } from "clsx"
import { useTranslations } from "next-intl"
import { Dispatch, ReactNode, SetStateAction } from "react"

type JoinGameButtonProps = {
  gameCode: string
  loading: boolean
  setLoading: Dispatch<SetStateAction<boolean>>
  className?: ClassValue
  children?: ReactNode
}
export const JoinGameButton = ({
  gameCode,
  loading,
  setLoading,
  className,
  children,
}: JoinGameButtonProps) => {
  const t = useTranslations("components.JoinGameButton")
  const tSocketError = useTranslations("utils.socket.error")
  const { username, saveUserInLocalStorage } = useUser()
  const { socket } = useSocket()
  const { toast } = useToast()
  const router = useRouter()

  let timeout: NodeJS.Timeout

  const joinErrorDescription: Record<ErrorJoinMessage, string> = {
    [ErrorConstants.ERROR.GAME_NOT_FOUND]: tSocketError(
      "game-not-found.description",
    ),
    [ErrorConstants.ERROR.GAME_ALREADY_STARTED]: tSocketError(
      "game-already-started.description",
    ),
    [ErrorConstants.ERROR.GAME_IS_FULL]: tSocketError(
      "game-is-full.description",
    ),
  }

  const handleJoiningGame = async () => {
    Howler.ctx.resume()
    if (socket === null) return
    setLoading(true)

    const player = saveUserInLocalStorage()

    timeout = setTimeout(() => {
      toast({
        description: tSocketError("timeout.description"),
        variant: "destructive",
        duration: 5000,
      })
    }, 10000)

    socket.emit("join", { gameCode, player })

    socket.once("error:join", (message: ErrorJoinMessage) => {
      clearTimeout(timeout)
      setLoading(false)

      router.replace(`/`)

      toast({
        description: joinErrorDescription[message],
        variant: "destructive",
        duration: 5000,
      })
    })

    socket.once(
      "game:join",
      (code: string, status: GameStatus, playerId: string) => {
        clearTimeout(timeout)

        localStorage.setItem(
          "lastGame",
          JSON.stringify({
            gameCode: code,
            playerId,
          }),
        )

        if (status === CoreConstants.GAME_STATUS.LOBBY)
          router.replace(`/game/${code}/lobby`)
        else router.replace(`/game/${code}`)
      },
    )
  }

  return (
    <Button
      onClick={handleJoiningGame}
      color="secondary"
      disabled={!username || socket === null}
      className={cn(className)}
      loading={loading}
      title={t("button")}
    >
      {children || t("button")}
    </Button>
  )
}
