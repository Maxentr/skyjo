"use client"

import { useToast } from "@/components/ui/use-toast"
import { useChat } from "@/contexts/ChatContext"
import { useSocket } from "@/contexts/SocketContext"
import { getCurrentUser, getOpponents } from "@/lib/skyjo"
import { useRouter } from "@/navigation"
import { Opponents } from "@/types/opponents"
import {
  Constants as CoreConstants,
  PlayPickCard,
  SkyjoPlayerToJson,
  SkyjoToJson,
} from "@skyjo/core"
import { UpdateGameSettings } from "@skyjo/shared/validations/updateGameSettings"
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

dayjs.extend(utc)

type SkyjoContext = {
  game: SkyjoToJson
  player: SkyjoPlayerToJson
  opponents: Opponents
  actions: {
    updateSingleSettings: <T extends keyof UpdateGameSettings>(
      key: T,
      value: UpdateGameSettings[T],
    ) => void
    updateSettings: (settings: UpdateGameSettings) => void
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
  const { dismiss: dismissToast } = useToast()

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
      if (gameStatusRef.current === CoreConstants.GAME_STATUS.PLAYING)
        saveLastGame()
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
  const updateSingleSettings = <T extends keyof UpdateGameSettings>(
    key: T,
    value: UpdateGameSettings[T],
  ) => {
    if (!player?.isAdmin) return

    switch (key) {
      case "private":
        socket!.emit(`game:settings:private`, value as boolean)
        break
      case "allowSkyjoForColumn":
        socket!.emit(`game:settings:allow-skyjo-for-column`, value as boolean)
        break
      case "allowSkyjoForRow":
        socket!.emit(`game:settings:allow-skyjo-for-row`, value as boolean)
        break
      case "initialTurnedCount":
        socket!.emit(`game:settings:initial-turned-count`, value as number)
        break
      case "cardPerColumn":
        socket!.emit(`game:settings:card-per-column`, value as number)
        break
      case "cardPerRow":
        socket!.emit(`game:settings:card-per-row`, value as number)
        break
      case "scoreToEndGame":
        socket!.emit(`game:settings:score-to-end-game`, value as number)
        break
      case "multiplierForFirstPlayer":
        socket!.emit(
          `game:settings:multiplier-for-first-player`,
          value as number,
        )
        break
      default:
        throw new Error(`Unknown settings: ${key}`)
    }
  }

  const updateSettings = (settings: UpdateGameSettings) => {
    if (!player?.isAdmin) return

    socket!.emit("game:settings", settings)
  }

  const resetSettings = () => {
    if (!player?.isAdmin) return

    socket!.emit("game:settings", {
      private: game?.settings.private ?? false,
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
    dismissToast()
    socket!.emit("leave")
  }

  const actions = {
    sendMessage,
    updateSingleSettings,
    updateSettings,
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
