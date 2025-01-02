"use client"

import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "@/i18n/routing"
import { Constants as SharedConstants } from "@skyjo/shared/constants"
import {
  ClientToServerEvents,
  ErrorRecoverMessage,
  ServerToClientEvents,
} from "@skyjo/shared/types"
import { LastGame } from "@skyjo/shared/validations"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import { WifiIcon, WifiOffIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { Socket, io } from "socket.io-client"
import customParser from "socket.io-msgpack-parser"

dayjs.extend(utc)

export type SkyjoSocket = Socket<ServerToClientEvents, ClientToServerEvents>

type SocketContext = {
  socket: SkyjoSocket | null
  getLastGameIfPossible: () => LastGame | null
  addReconnectionDateToLastGame: () => void
  clearLastGame: () => void
}
const SocketContext = createContext<SocketContext | undefined>(undefined)

const SocketProvider = ({ children }: PropsWithChildren) => {
  const { toast } = useToast()
  const t = useTranslations("contexts.SocketContext")
  const router = useRouter()

  const [socket, setSocket] = useState<SkyjoSocket | null>(null)

  useEffect(() => {
    if (socket !== null) return

    if (!process.env.NEXT_PUBLIC_API_URL) {
      throw new Error("NEXT_PUBLIC_API_URL is not set")
    }

    const newSocket = io(process.env.NEXT_PUBLIC_API_URL, {
      autoConnect: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      parser: customParser,
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [])

  useEffect(() => {
    if (socket === null) return
    initGameListeners()

    return () => destroyGameListeners()
  }, [socket])

  //#region reconnection
  const addReconnectionDateToLastGame = () => {
    if (typeof window === "undefined") return

    const lastGameString = localStorage.getItem("lastGame")
    if (!lastGameString) return
    const lastGame = JSON.parse(lastGameString) as LastGame

    const maxDateToReconnect = dayjs()
      .add(SharedConstants.CONNECTION_LOST_TIMEOUT_IN_MS, "milliseconds")
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

  const getLastGameIfPossible = () => {
    const lastGame = getLastGame()

    if (!lastGame?.maxDateToReconnect) return null

    const nowUTC = dayjs().utc()
    const maxDateUTC = dayjs(lastGame.maxDateToReconnect).utc()

    const diff = maxDateUTC.diff(nowUTC, "seconds")
    const canReconnect = diff >= 0

    if (!canReconnect) localStorage.removeItem("lastGame")

    return canReconnect ? lastGame : null
  }

  const clearLastGame = () => {
    localStorage.removeItem("lastGame")
  }
  //#endregion reconnection

  //#region listeners
  const onConnect = () => {
    if (socket!.recovered) {
      console.log("Socket reconnected")
      toast({
        title: (
          <span className="flex items-center gap-2 font-medium">
            <WifiIcon className="w-5 h-5 text-emerald-600" />
            {t("reconnection")}
          </span>
        ),
        duration: 2000,
      })
    } else console.log("Socket connected")
  }

  const onConnectionLost = (reason: Socket.DisconnectReason) => {
    if (reason === "ping timeout") addReconnectionDateToLastGame()

    if (socket?.active) {
      toast({
        title: (
          <span className="flex items-center gap-2 font-medium">
            <WifiOffIcon className="w-5 h-5" />
            {t("connection-lost")}
          </span>
        ),
        variant: "warn",
        duration: 5000,
      })
    }
  }

  const onConnectionError = (err: unknown) => {
    console.error("Socket error", err)
  }

  const onRecoverError = (message: ErrorRecoverMessage) => {
    console.log("onRecoverError", message)
    if (message === "game-not-found") {
      router.replace("/")
      toast({
        title: t("recover-error.game-not-found.title"),
        description: t("recover-error.game-not-found.description"),
        duration: 5000,
        variant: "warn",
      })
    }
  }

  const initGameListeners = () => {
    socket!.on("connect", onConnect)
    socket!.on("disconnect", onConnectionLost)
    socket!.on("connect_error", onConnectionError)
    socket!.on("error:recover", onRecoverError)
  }
  const destroyGameListeners = () => {
    socket!.off("connect", onConnect)
    socket!.off("disconnect", onConnectionLost)
    socket!.off("connect_error", onConnectionError)
    socket!.off("error:recover", onRecoverError)
  }
  //#endregion

  const value = useMemo(
    () => ({
      socket,
      addReconnectionDateToLastGame,
      getLastGameIfPossible,
      clearLastGame,
    }),
    [socket, socket?.recovered],
  )

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  )
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider")
  }
  return context
}

export default SocketProvider
