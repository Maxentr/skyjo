"use client"

import { CreatePrivateGameButton } from "@/components/CreatePrivateGameButton"
import { FindPublicGameButton } from "@/components/FindPublicGameButton"
import { JoinGameButton } from "@/components/JoinGameButton"
import { ReconnectGameButton } from "@/components/ReconnectGameButton"
import { useSocket } from "@/contexts/SocketContext"
import { useState } from "react"
type GameLobbyButtonsProps = {
  gameCode?: string
  hideReconnectButton?: boolean
}

const GameLobbyButtons = ({
  gameCode,
  hideReconnectButton = false,
}: GameLobbyButtonsProps) => {
  const hasGameCode = !!gameCode
  const { getLastGameIfPossible } = useSocket()

  const [loading, setLoading] = useState<boolean>(false)

  const lastGame = getLastGameIfPossible()

  return (
    <div className="flex flex-col gap-2 mt-6">
      {hideReconnectButton && (
        <ReconnectGameButton loading={loading} setLoading={setLoading} />
      )}
      {hasGameCode && !lastGame && (
        <JoinGameButton
          gameCode={gameCode}
          loading={loading}
          setLoading={setLoading}
        />
      )}
      <FindPublicGameButton loading={loading} setLoading={setLoading} />
      <CreatePrivateGameButton loading={loading} setLoading={setLoading} />
    </div>
  )
}

export default GameLobbyButtons
