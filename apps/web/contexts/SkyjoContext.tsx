"use client"

import { useChat } from "@/contexts/ChatContext"
import { useSocket } from "@/contexts/SocketContext"
import { getCurrentUser, getOpponents } from "@/lib/skyjo"
import { useRouter } from "@/navigation"
import { Opponents } from "@/types/opponents"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { GAME_STATUS } from "shared/constants"
import { SkyjoToJson } from "shared/types/skyjo"
import { SkyjoPlayerToJson } from "shared/types/skyjoPlayer"
import { ChangeSettings } from "shared/validations/changeSettings"
import { PlayPickCard } from "shared/validations/play"

dayjs.extend(utc)

type SkyjoContext = {
  game: SkyjoToJson
  player: SkyjoPlayerToJson
  opponents: Opponents
  actions: {
    changeSettings: (settings: ChangeSettings) => void
    resetSettings: () => void
    startGame: () => void
    playRevealCard: (column: number, row: number) => void
    pickCardFromPile: (pile: PlayPickCard["pile"]) => void
    replaceCard: (column: number, row: number) => void
    discardSelectedCard: () => void
    turnCard: (column: number, row: number) => void
    replay: () => void
    leave: () => void
  }
}

const SkyjoContext = createContext<SkyjoContext | undefined>(undefined)

interface SkyjoProviderProps extends PropsWithChildren {
  gameCode: string
}

const SkyjoProvider = ({ children, gameCode }: SkyjoProviderProps) => {
  const { socket, saveLastGame } = useSocket()
  const { sendMessage, setChat } = useChat()
  const router = useRouter()

  const [game, setGame] = useState<SkyjoToJson>()

  const player = getCurrentUser(game?.players, socket?.id ?? "")
  const opponents = getOpponents(game?.players, socket?.id ?? "")

  useEffect(() => {
    if (!gameCode || !socket) return

    initGameListeners()

    // get game
    socket.emit("get")

    return destroyGameListeners
  }, [socket, gameCode])

  //#region reconnection
  const gameStatusRef = useRef(game?.status)

  useEffect(() => {
    gameStatusRef.current = game?.status
  }, [game?.status])

  useEffect(() => {
    const onUnload = () => {
      if (gameStatusRef.current === GAME_STATUS.PLAYING) saveLastGame()
    }

    window.addEventListener("beforeunload", onUnload)

    return () => {
      window.removeEventListener("beforeunload", onUnload)
    }
  }, [])
  //#endregion

  //#region listeners
  const onGameUpdate = async (game: SkyjoToJson) => {
    console.log("game updated", game)
    setGame(game)
  }

  const onLeave = () => {
    setGame(undefined)
    setChat([])
    router.replace("/")
  }

  const initGameListeners = () => {
    socket!.on("game", onGameUpdate)
    socket!.on("leave:success", onLeave)
  }
  const destroyGameListeners = () => {
    socket!.off("game", onGameUpdate)
    socket!.off("leave:success", onLeave)
  }
  //#endregion

  //#region actions
  const changeSettings = (settings: ChangeSettings) => {
    if (!player?.isAdmin) return

    if (
      settings.cardPerColumn * settings.cardPerRow <=
      settings.initialTurnedCount
    ) {
      settings.initialTurnedCount =
        settings.cardPerColumn * settings.cardPerRow - 1
    }

    if (settings.cardPerColumn === 1 && settings.cardPerRow === 1) {
      settings.cardPerColumn = 2
    }

    socket!.emit("settings", settings)
  }

  const resetSettings = () => {
    if (!player?.isAdmin) return

    socket!.emit("settings", {
      private: game?.settings.private,
    })
  }

  const startGame = () => {
    if (!player?.isAdmin) return

    socket!.emit("start")
  }

  const playRevealCard = (column: number, row: number) => {
    socket!.emit("play:reveal-card", {
      column: column,
      row: row,
    })
  }

  const pickCardFromPile = (pile: PlayPickCard["pile"]) => {
    socket!.emit("play:pick-card", {
      pile,
    })
  }

  const replaceCard = (column: number, row: number) => {
    socket!.emit("play:replace-card", {
      column: column,
      row: row,
    })
  }

  const discardSelectedCard = () => {
    socket!.emit("play:discard-selected-card")
  }

  const turnCard = (column: number, row: number) => {
    socket!.emit("play:turn-card", {
      column: column,
      row: row,
    })
  }

  const replay = () => {
    socket!.emit("replay")
  }

  const leave = () => {
    socket!.emit("leave")
  }

  const actions = {
    sendMessage,
    changeSettings,
    resetSettings,
    startGame,
    playRevealCard,
    pickCardFromPile,
    replaceCard,
    discardSelectedCard,
    turnCard,
    replay,
    leave,
  }
  //#endregion

  const providerValue = useMemo(
    () => ({
      game: game as SkyjoToJson,
      player: player as SkyjoPlayerToJson,
      opponents,
      actions,
    }),
    [game, opponents, player],
  )

  if (!game || !player) return null

  return (
    <SkyjoContext.Provider value={providerValue}>
      {children}
    </SkyjoContext.Provider>
  )
}

export const useSkyjo = () => {
  const context = useContext(SkyjoContext)
  if (context === undefined) {
    throw new Error("useSkyjo must be used within a SkyjoProvider")
  }
  return context
}
export default SkyjoProvider
