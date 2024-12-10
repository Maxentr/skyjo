"use client"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useSocket } from "@/contexts/SocketContext"
import { useUser } from "@/contexts/UserContext"
import { useRouter } from "@/i18n/routing"
import { Constants as CoreConstants, GameStatus } from "@skyjo/core"
import { Constants as ErrorConstants } from "@skyjo/error"
import { ErrorJoinMessage } from "@skyjo/shared/types"
import { useTranslations } from "next-intl"
import { Dispatch, SetStateAction } from "react"

type CreateGameButtonProps = {
  type: "private" | "public"
  loading: boolean
  setLoading: Dispatch<SetStateAction<boolean>>
}
export const CreateGameButton = ({
  type,
  loading,
  setLoading,
}: CreateGameButtonProps) => {
  const t = useTranslations("components.CreateGameButton")
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

  const handleGameCreation = async () => {
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

    socket.emit("create", player, type === "private")

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
      onClick={handleGameCreation}
      className="w-full"
      disabled={!username || socket === null}
      loading={loading}
      title={t("button", { type })}
    >
      {t("button", { type })}
    </Button>
  )
}
