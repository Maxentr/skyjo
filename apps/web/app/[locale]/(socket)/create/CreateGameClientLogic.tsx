"use client"

import { Card } from "@/components/Card"
import { useSocket } from "@/contexts/SocketContext"
import { useUser } from "@/contexts/UserContext"
import { SkyjoCardToJson } from "@skyjo/core"
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
  const { getUser } = useUser()
  const { socket, createGame } = useSocket()
  const searchParams = useSearchParams()
  const t = useTranslations("pages.Create")

  const [card, setCard] = useState<SkyjoCardToJson>(generateRandomCard(true))

  const privateQueryParam = searchParams.get("private")

  const isPrivate = privateQueryParam === "true"

  useEffect(() => {
    // loading card animation
    setInterval(() => {
      setCard((prev) => generateRandomCard(!prev.isVisible))
    }, 1800)

    const player = getUser()
    createGame(player, isPrivate)
  }, [socket, isPrivate])

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
