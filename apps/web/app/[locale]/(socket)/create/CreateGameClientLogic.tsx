"use client"

import { Card } from "@/components/Card"
import { useToast } from "@/components/ui/use-toast"
import { useSocket } from "@/contexts/SocketContext"
import { useUser } from "@/contexts/UserContext"
import { useRouter } from "@/i18n/routing"
import {
  Constants as CoreConstants,
  GameStatus,
  SkyjoCardToJson,
} from "@skyjo/core"
import { Constants as ErrorConstants } from "@skyjo/error"
import { ErrorJoinMessage } from "@skyjo/shared/types"
import { useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

const generateRandomCard = (isVisible: boolean): SkyjoCardToJson => {
  const value = isVisible ? Math.floor(Math.random() * 14) - 2 : undefined

  return {
    id: "loading-cards",
    value,
    isVisible,
  }
}

const CreateGameClientLogic = () => {
  const { socket } = useSocket()
  const { getUser } = useUser()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const t = useTranslations("pages.Create")
  const tSocketError = useTranslations("utils.socket.error")

  const [card, setCard] = useState<SkyjoCardToJson>(generateRandomCard(true))

  const privateQueryParam = searchParams.get("private")

  const isPrivate = privateQueryParam === "true"

  useEffect(() => {
    // loading card animation
    const interval = setInterval(() => {
      setCard((prev) => generateRandomCard(!prev.isVisible))
    }, 1800)

    const player = getUser()

    try {
      socket!.once("error:join", handleGameJoinError)
      socket!.once("game:join", handleGameJoin)

      socket!.timeout(10000).emit("create", player, isPrivate)
    } catch {
      toast({
        description: tSocketError("timeout.description"),
        variant: "destructive",
        duration: 5000,
      })
    }

    return () => clearInterval(interval)
  }, [])

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

  const handleGameJoinError = (message: ErrorJoinMessage) => {
    router.replace(`/`)

    toast({
      description: joinErrorDescription[message],
      variant: "destructive",
      duration: 5000,
    })
  }

  const handleGameJoin = (
    code: string,
    status: GameStatus,
    playerId: string,
  ) => {
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
  }

  return (
    <div className="h-svh w-full flex flex-col gap-2 items-center justify-center">
      <Card
        key={card.id}
        card={card}
        size="normal"
        disabled={true}
        flipAnimation={true}
        exitAnimation={false}
      />

      <p>{t("loading-text")}</p>
    </div>
  )
}

export { CreateGameClientLogic }
