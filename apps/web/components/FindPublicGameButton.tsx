"use client"

import { Button } from "@/components/ui/button"
import { useSocket } from "@/contexts/SocketContext"
import { useRouter } from "@/i18n/routing"
import { useTranslations } from "next-intl"
import { Dispatch, SetStateAction } from "react"

type FindPublicGameButtonProps = {
  loading: boolean
  setLoading: Dispatch<SetStateAction<boolean>>
}
export const FindPublicGameButton = ({
  loading,
  setLoading,
}: FindPublicGameButtonProps) => {
  const t = useTranslations("components.FindPublicGameButton")
  const router = useRouter()
  const { socket } = useSocket()

  const handleGameCreation = async () => {
    Howler.ctx.resume()
    if (socket === null) return
    setLoading(true)
    router.replace("/search")
  }

  return (
    <Button
      onClick={handleGameCreation}
      className="w-full"
      loading={loading}
      title={t("button")}
    >
      {t("button")}
    </Button>
  )
}
