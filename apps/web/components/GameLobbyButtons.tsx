"use client"

import { Button } from "@/components/ui/button"
import { useSocket } from "@/contexts/SocketContext"
import { useUser } from "@/contexts/UserContext"
import { useRouter } from "@/i18n/routing"
import { getLastGameIfPossible } from "@/utils/reconnection"
import { useTranslations } from "next-intl"
import { useState } from "react"

type GameLobbyButtonsProps = {
  gameCode?: string
  hideReconnectButton?: boolean
}

const GameLobbyButtons = ({
  gameCode,
  hideReconnectButton = false,
}: GameLobbyButtonsProps) => {
  const { reconnectGame, joinGame } = useSocket()
  const { getUser, username, saveUserInLocalStorage } = useUser()
  const t = useTranslations("components.GameLobbyButtons")
  const router = useRouter()

  const hasGameCode = !!gameCode

  const [loading, setLoading] = useState<boolean>(false)

  const lastGame = getLastGameIfPossible()

  const errorCallback = () => setLoading(false)

  const handleReconnection = async () => {
    if (!lastGame) {
      setLoading(false)
      return
    }

    reconnectGame(lastGame, errorCallback)
  }

  const handleJoiningGame = async () => {
    const player = getUser()

    joinGame(player, gameCode!, errorCallback)
  }

  const handleFindingGame = async () => {
    saveUserInLocalStorage()
    router.replace("/search")
  }

  const handleGameCreation = async () => {
    saveUserInLocalStorage()
    router.replace("/create?private=true")
  }

  const actions = {
    "reconnect-game": handleReconnection,
    "join-game": handleJoiningGame,
    "find-game": handleFindingGame,
    "create-game": handleGameCreation,
  }

  const handleAction = (action: keyof typeof actions) => {
    setLoading(true)
    Howler.ctx.resume()

    actions[action]()
  }

  return (
    <div className="flex flex-col gap-2 mt-6">
      {!hideReconnectButton && lastGame && (
        <Button
          onClick={() => handleAction("reconnect-game")}
          color="secondary"
          className="w-full mb-4"
          disabled={!username}
          loading={loading}
          title={t("reconnect-game-button")}
        >
          {t("reconnect-game-button")}
        </Button>
      )}
      {hasGameCode && !lastGame && (
        <Button
          onClick={() => handleAction("join-game")}
          color="secondary"
          disabled={!username}
          className="w-full mb-4"
          loading={loading}
          title={t("join-game-button")}
        >
          {t("join-game-button")}
        </Button>
      )}
      <Button
        onClick={() => handleAction("find-game")}
        className="w-full"
        loading={loading}
        disabled={!username}
        title={t("find-game-button")}
      >
        {t("find-game-button")}
      </Button>
      <Button
        onClick={handleGameCreation}
        className="w-full"
        disabled={!username}
        loading={loading}
        title={t("create-game-button", { type: "private" })}
      >
        {t("create-game-button", { type: "private" })}
      </Button>
    </div>
  )
}

export default GameLobbyButtons
