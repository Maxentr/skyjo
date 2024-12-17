"use client"

import { CreateGameButton } from "@/components/CreateGameButton"
import { FindPublicGameButton } from "@/components/FindPublicGameButton"
import { JoinGameButton } from "@/components/JoinGameButton"
import { ReconnectGameButton } from "@/components/ReconnectGameButton"
import { useSocket } from "@/contexts/SocketContext"
import { usePathname, useRouter } from "@/i18n/routing"
import { useSearchParams } from "next/navigation"
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
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState<boolean>(false)

  const lastGame = getLastGameIfPossible()

  const onJoinGameError = () => {
    let route = `${pathname}`
    if (searchParams.has("gameCode")) {
      const nextSearchParams = new URLSearchParams(searchParams.toString())
      nextSearchParams.delete("gameCode")
      route += `?${nextSearchParams}`
    }

    router.replace(route)
  }

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
          className="w-full mb-4"
          onError={onJoinGameError}
        />
      )}
      <FindPublicGameButton
        loading={loading}
        setLoading={setLoading}
        className="w-full"
      />
      <CreateGameButton
        type="private"
        loading={loading}
        setLoading={setLoading}
        className="w-full"
      />
    </div>
  )
}

export default GameLobbyButtons
