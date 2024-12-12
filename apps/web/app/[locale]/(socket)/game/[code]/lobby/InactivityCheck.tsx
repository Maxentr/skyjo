"use client"

import { ToastAction } from "@/components/ui/toast"
import { ToastReturn, useToast } from "@/components/ui/use-toast"
import { useSkyjo } from "@/contexts/SkyjoContext"
import { isAdmin } from "@/lib/skyjo"
import { useTranslations } from "next-intl"
import { useEffect } from "react"

const INACTIVITY_CHECK_INTERVAL = 30000
const INACTIVITY_DISCONNECTION_INTERVAL = 60000

const inactivtySound = new Howl({
  src: ["/sounds/inactivity.ogg"],
})

const InactivityCheck = () => {
  const { player, game, actions, opponents } = useSkyjo()
  const t = useTranslations("pages.InactivityCheck")
  const { toast } = useToast()

  const admin = isAdmin(game, player?.id)

  let timer: NodeJS.Timeout | null = null
  let warningTimer: NodeJS.Timeout | null = null

  let warningToast: ToastReturn | null = null

  const clearTimers = () => {
    if (timer) clearTimeout(timer)
    if (warningTimer) clearTimeout(warningTimer)
  }

  const createTimers = () => {
    warningTimer = setTimeout(() => {
      warningToast = toast({
        title: t("warning.title"),
        variant: "default",
        duration: INACTIVITY_CHECK_INTERVAL - 1000,
        action: (
          <ToastAction
            onClick={() => {
              if (warningToast) warningToast.dismiss()
              clearTimers()
              createTimers()
            }}
            altText={t("warning.button.title")}
          >
            {t("warning.button.label")}
          </ToastAction>
        ),
      })
      inactivtySound.play()
    }, INACTIVITY_CHECK_INTERVAL)

    timer = setTimeout(() => {
      toast({
        title: t("timeout.title"),
        description: t("timeout.description"),
        variant: "default",
        duration: Infinity,
      })
      actions.leave()
    }, INACTIVITY_DISCONNECTION_INTERVAL)
  }

  useEffect(() => {
    if (!admin) return

    if (warningToast) warningToast.dismiss()
    clearTimers()

    if (game.settings.private || opponents.flat().length === 0) return

    createTimers()

    return clearTimers
  }, [admin, game.updatedAt, game.settings, opponents])

  return null
}

export default InactivityCheck
