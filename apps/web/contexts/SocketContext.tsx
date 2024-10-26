"use client"

import { useToast } from "@/components/ui/use-toast"
import { Constants as CoreConstants } from "@skyjo/core"
import { Constants as SharedConstants } from "@skyjo/shared/constants"
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@skyjo/shared/types/socket"
import { LastGame } from "@skyjo/shared/validations/reconnect"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
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

const initSocket = (url: string) => {
  console.log("Connecting to", url)
  const socket = io(url, {
    autoConnect: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 2000,
    parser: customParser,
  })

  return socket
}

export type SkyjoSocket = Socket<ServerToClientEvents, ClientToServerEvents>

type SocketContext = {
  socket: SkyjoSocket | null
  createSocket: () => void
  getLastGameIfPossible: () => LastGame | null
  saveLastGame: () => void
}
const SocketContext = createContext<SocketContext | undefined>(undefined)

const SocketProvider = ({ children }: PropsWithChildren) => {
  const { toast } = useToast()
  const t = useTranslations("contexts.SocketContext")

  const [socket, setSocket] = useState<SkyjoSocket | null>(null)

  useEffect(() => {
    if (socket === null) return

    initGameListeners()

    return () => {
      destroyGameListeners()
    }
  }, [socket])

  //#region reconnection
  const saveLastGame = () => {
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
  //#endregion reconnection

  const createSocket = async () => {
    if (!process.env.NEXT_PUBLIC_API_URL)
      throw new Error("NEXT_PUBLIC_API_URL is not set")

    setSocket(initSocket(process.env.NEXT_PUBLIC_API_URL))
  }

  //#region listeners
  const onConnect = () => {
    if (socket!.recovered) console.log("Socket reconnected")
    else console.log("Socket connected")
  }

  const onConnectionLost = (reason: Socket.DisconnectReason, details?: any) => {
    // the reason of the disconnection, for example "transport error"
    console.log(reason)

    // the low-level reason of the disconnection, for example "xhr post error"
    console.log(details?.message)

    // some additional description, for example the status code of the HTTP response
    console.log(details?.description)

    // some additional context, for example the XMLHttpRequest object
    console.log(details?.context)

    console.log("Socket disconnected", reason, details)
    toast({
      description: t(CoreConstants.CONNECTION_STATUS.CONNECTION_LOST),
      variant: "destructive",
      duration: 5000,
    })

    if (reason === "ping timeout") saveLastGame()
  }

  const onConnectionError = (err: unknown) => {
    console.error("Socket error", err)
  }

  const initGameListeners = () => {
    socket!.on("connect", onConnect)
    socket!.on("disconnect", onConnectionLost)
    socket!.on("connect_error", onConnectionError)
  }
  const destroyGameListeners = () => {
    socket!.off("connect", onConnect)
    socket!.off("disconnect", onConnectionLost)
    socket!.off("connect_error", onConnectionError)
  }
  //#endregion

  const value = useMemo(
    () => ({
      socket,
      createSocket,
      saveLastGame,
      getLastGameIfPossible,
    }),
    [socket],
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
