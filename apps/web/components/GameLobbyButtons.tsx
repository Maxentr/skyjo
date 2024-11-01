"use client"

import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useSocket } from "@/contexts/SocketContext"
import { useUser } from "@/contexts/UserContext"
import { useRouter } from "@/navigation"
import {
  Constants as CoreConstants,
  CreatePlayer,
  GameStatus,
} from "@skyjo/core"
import { Constants as ErrorConstants } from "@skyjo/error"
import { ErrorJoinMessage, ErrorReconnectMessage } from "@skyjo/shared/types"
import { useTranslations } from "next-intl"
import { useState } from "react"

export type GameLobbyButtonAction =
  | "join"
  | "find"
  | "create-private"
  | "reconnect"
type GameLobbyButtonsProps = {
  gameCode?: string
  beforeButtonAction: (
    type: GameLobbyButtonAction,
  ) => Promise<CreatePlayer | undefined> | CreatePlayer | undefined
  hideReconnectButton?: boolean
}

const GameLobbyButtons = ({
  gameCode,
  beforeButtonAction,
  hideReconnectButton = false,
}: GameLobbyButtonsProps) => {
  const hasGameCode = !!gameCode

  const t = useTranslations("components.GameLobbyButtons")
  const { username } = useUser()
  const { socket, getLastGameIfPossible } = useSocket()
  const { toast } = useToast()
  const router = useRouter()

  const [loading, setLoading] = useState(false)

  const lastGame = getLastGameIfPossible()

  const handleButtons = async (type: GameLobbyButtonAction) => {
    Howler.ctx.resume()
    if (socket === null) return
    setLoading(true)

    const player = await beforeButtonAction(type)
    if (!player) return

    if (type === "reconnect") {
      handleReconnection()
    } else if (type === "join")
      socket.emit("join", { gameCode: gameCode!, player })
    else socket.emit(type, player)

    const timeout = setTimeout(() => {
      toast({
        description: t("timeout.description"),
        variant: "destructive",
        duration: 5000,
      })
    }, 10000)

    socket.once("error:join", (message: ErrorJoinMessage) => {
      clearTimeout(timeout)
      setLoading(false)

      const descriptionObject: Record<ErrorJoinMessage, string> = {
        [ErrorConstants.ERROR.GAME_NOT_FOUND]: t("game-not-found.description"),
        [ErrorConstants.ERROR.GAME_ALREADY_STARTED]: t(
          "game-already-started.description",
        ),
        [ErrorConstants.ERROR.GAME_IS_FULL]: t("game-is-full.description"),
      }

      router.replace(`/`)

      toast({
        description: descriptionObject[message],
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

  const handleReconnection = () => {
    if (socket === null) return

    delete lastGame?.maxDateToReconnect
    socket.emit("reconnect", lastGame)

    socket.once("error:reconnect", (message: ErrorReconnectMessage) => {
      setLoading(false)

      const descriptionObject: Record<ErrorReconnectMessage, string> = {
        [ErrorConstants.ERROR.CANNOT_RECONNECT]: t(
          "cannot-reconnect.description",
        ),
      }

      toast({
        description: descriptionObject[message],
        variant: "destructive",
        duration: 5000,
      })

      router.replace("/")
    })
  }

  return (
    <div className="flex flex-col gap-2 mt-6">
      {lastGame && !hideReconnectButton && (
        <Button
          onClick={() => handleButtons("reconnect")}
          color="secondary"
          className="w-full mb-4"
          disabled={!username || socket === null}
          loading={loading}
        >
          {t("reconnect-game-button")}
        </Button>
      )}
      {hasGameCode && !lastGame && (
        <Button
          onClick={() => handleButtons("join")}
          color="secondary"
          className="w-full mb-4"
          disabled={!username || socket === null}
          loading={loading}
        >
          {t("join-game-button")}
        </Button>
      )}

      <Button
        onClick={() => handleButtons("find")}
        color="secondary"
        className="w-full"
        disabled={!username || socket === null}
        loading={loading}
      >
        {t("find-game-button")}
      </Button>
      <Button
        onClick={() => handleButtons("create-private")}
        className="w-full"
        disabled={!username || socket === null}
        loading={loading}
      >
        {t("create-private-game-button")}
      </Button>
    </div>
  )
}

export default GameLobbyButtons
