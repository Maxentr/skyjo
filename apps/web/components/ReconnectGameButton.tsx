"use client"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useSocket } from "@/contexts/SocketContext"
import { useUser } from "@/contexts/UserContext"
import { useRouter } from "@/i18n/routing"
import { Constants as CoreConstants, GameStatus } from "@skyjo/core"
import { Constants as ErrorConstants } from "@skyjo/error"
import { ErrorJoinMessage, ErrorReconnectMessage } from "@skyjo/shared/types"
import { useTranslations } from "next-intl"
import { Dispatch, SetStateAction } from "react"

type ReconnectGameButtonProps = {
  loading: boolean
  setLoading: Dispatch<SetStateAction<boolean>>
}
export const ReconnectGameButton = ({
  loading,
  setLoading,
}: ReconnectGameButtonProps) => {
  const t = useTranslations("components.ReconnectGameButton")
  const tSocketError = useTranslations("utils.socket.error")
  const { username } = useUser()
  const { socket, getLastGameIfPossible, clearLastGame } = useSocket()
  const { toast } = useToast()
  const router = useRouter()

  const lastGame = getLastGameIfPossible()

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

  const reconnectErrorDescription: Record<ErrorReconnectMessage, string> = {
    [ErrorConstants.ERROR.CANNOT_RECONNECT]: tSocketError(
      "cannot-reconnect.description",
    ),
  }

  const handleReconnection = async () => {
    Howler.ctx.resume()
    if (socket === null) return
    setLoading(true)

    timeout = setTimeout(() => {
      toast({
        description: tSocketError("timeout.description"),
        variant: "destructive",
        duration: 5000,
      })
    }, 10000)

    delete lastGame?.maxDateToReconnect
    socket.emit("reconnect", lastGame)

    socket.once("error:reconnect", (message: ErrorReconnectMessage) => {
      setLoading(false)
      clearTimeout(timeout)
      clearLastGame()

      toast({
        description: reconnectErrorDescription[message],
        variant: "destructive",
        duration: 5000,
      })

      router.replace("/")
    })

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
  if (!lastGame) return null

  return (
    <Button
      onClick={handleReconnection}
      color="secondary"
      className="w-full mb-4"
      disabled={!username || socket === null}
      loading={loading}
      title={t("button")}
    >
      {t("button")}
    </Button>
  )
}
