"use client"

import { Button } from "@/components/ui/button"
import { useSocket } from "@/contexts/SocketContext"
import { useUser } from "@/contexts/UserContext"
import { cn } from "@/lib/utils"
import { ClassValue } from "clsx"
import { useTranslations } from "next-intl"
import { Dispatch, ReactNode, SetStateAction } from "react"

type JoinGameButtonProps = {
  gameCode: string
  loading: boolean
  setLoading: Dispatch<SetStateAction<boolean>>
  className?: ClassValue
  children?: ReactNode
  onError: () => void
}
export const JoinGameButton = ({
  gameCode,
  loading,
  setLoading,
  className,
  children,
  onError,
}: JoinGameButtonProps) => {
  const t = useTranslations("components.GameLobbyButtons")
  const { getUser, username } = useUser()
  const { joinGame } = useSocket()

  const handleJoiningGame = async () => {
    setLoading(true)
    Howler.ctx.resume()
    const player = getUser()

    joinGame(player, gameCode, onError)
  }

  return (
    <Button
      onClick={handleJoiningGame}
      color="secondary"
      disabled={!username}
      className={cn(className)}
      loading={loading}
      title={t("join-game-button")}
    >
      {children || t("join-game-button")}
    </Button>
  )
}
