import { routing } from "@/i18n/routing"
import { Constants as CoreConstants, GameStatus } from "@skyjo/core"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getGameInviteLink = (gameCode: string) => {
  return `${process.env.NEXT_PUBLIC_SITE_URL}/?gameCode=${gameCode}`
}

export const getCurrentUrl = (route: string, locale?: string) => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""
  const url =
    locale && locale !== routing.defaultLocale
      ? `${baseUrl}/${locale}/${route}`
      : `${baseUrl}/${route}`

  return url
}

export const getRedirectionUrl = (code: string, status: GameStatus) => {
  const redirectionUrls = {
    [CoreConstants.GAME_STATUS.LOBBY]: `/game/${code}/lobby`,
    [CoreConstants.GAME_STATUS.PLAYING]: `/game/${code}`,
    [CoreConstants.GAME_STATUS.STOPPED]: `/game/${code}/results`,
    [CoreConstants.GAME_STATUS.FINISHED]: `/game/${code}/results`,
  } as const

  return redirectionUrls[status]
}
