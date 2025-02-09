import { Constants as SharedConstants } from "@skyjo/shared/constants"
import { LastGame } from "@skyjo/shared/validations"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"

dayjs.extend(utc)

export const addReconnectionDateToLastGame = () => {
  if (typeof window === "undefined") return

  const lastGameString = localStorage.getItem("lastGame")
  if (!lastGameString) return
  const lastGame = JSON.parse(lastGameString) as LastGame

  const maxDateToReconnect = dayjs()
    .add(SharedConstants.LEAVE_TIMEOUT_IN_MS, "milliseconds")
    .format()

  localStorage.setItem(
    "lastGame",
    JSON.stringify({
      ...lastGame,
      maxDateToReconnect: maxDateToReconnect,
    } satisfies LastGame),
  )
}

const getLastGame = () => {
  if (typeof window === "undefined") return
  const lastGameString = localStorage.getItem("lastGame")

  if (!lastGameString) return null

  return JSON.parse(lastGameString) as LastGame
}

export const getLastGameIfPossible = () => {
  const lastGame = getLastGame()

  if (!lastGame?.maxDateToReconnect) return null

  const nowUTC = dayjs().utc()
  const maxDateUTC = dayjs(lastGame.maxDateToReconnect).utc()

  const diff = maxDateUTC.diff(nowUTC, "seconds")
  const canReconnect = diff >= 0

  if (!canReconnect) clearLastGame()

  return canReconnect ? lastGame : null
}

export const clearLastGame = () => localStorage.removeItem("lastGame")
