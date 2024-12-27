"use client"

import { Button } from "@/components/ui/button"
import { useSocket } from "@/contexts/SocketContext"
import { useUser } from "@/contexts/UserContext"
import { useRouter } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import { ClassValue } from "clsx"
import { useTranslations } from "next-intl"
import { Dispatch, SetStateAction } from "react"

type CreateGameButtonProps = {
  type: "private" | "public"
  loading: boolean
  setLoading: Dispatch<SetStateAction<boolean>>
  className?: ClassValue
}
export const CreateGameButton = ({
  type,
  loading,
  setLoading,
  className,
}: CreateGameButtonProps) => {
  const t = useTranslations("components.CreateGameButton")
  const { username, saveUserInLocalStorage } = useUser()
  const { socket } = useSocket()
  const router = useRouter()

  const handleGameCreation = async () => {
    Howler.ctx.resume()
    if (socket === null) return
    setLoading(true)

    saveUserInLocalStorage()

    router.push(`/create?private=${type === "private"}`)
  }

  return (
    <Button
      onClick={handleGameCreation}
      className={cn(className)}
      disabled={!username || socket === null}
      loading={loading}
      title={t("button", { type })}
    >
      {t("button", { type })}
    </Button>
  )
}
