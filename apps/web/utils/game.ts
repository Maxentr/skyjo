import type { Toast, ToastReturn } from "@/components/ui/use-toast"
import { GameStatus } from "@skyjo/core"
import { Constants as CoreConstants } from "@skyjo/core"
import { ErrorJoinMessage } from "@skyjo/shared/types"
import { type AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"

export const handleGameJoinSuccess = (
  code: string,
  status: GameStatus,
  playerId: string,
  router: AppRouterInstance,
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

export const handleGameJoinError = (
  message: ErrorJoinMessage,
  router: AppRouterInstance,
  toast: ({ ...props }: Toast) => ToastReturn,
  errorMessages: Record<ErrorJoinMessage, string>,
) => {
  toast({
    description: errorMessages[message],
    variant: "destructive",
    duration: 5000,
  })

  router.replace(document?.referrer ?? "/")
}
