"use client"

import { useSettings } from "@/contexts/SettingsContext"
import { useSocket } from "@/contexts/SocketContext"
import { useUser } from "@/contexts/UserContext"
import { Constants as CoreConstants, SystemMessageType } from "@skyjo/core"
import { Constants as SharedConstants } from "@skyjo/shared/constants"
import {
  ChatMessage,
  ServerChatMessage,
  SystemChatMessage,
  UserChatMessage,
} from "@skyjo/shared/types"
import { Howl } from "howler"
import { useTranslations } from "next-intl"
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"

const messageSound = new Howl({
  src: ["/sounds/message.ogg"],
})
const playerJoinedSound = new Howl({
  src: ["/sounds/player-joined.ogg"],
})
const playerLeftSound = new Howl({
  src: ["/sounds/player-left.ogg"],
})
const wizzSound = new Howl({
  src: "/sounds/wizz.ogg",
})

type ChatContext = {
  chat: ChatMessage[]
  unreadMessages: ChatMessage[]
  hasUnreadMessage: boolean
  setHasUnreadMessage: (hasUnreadMessage: boolean) => void
  addUnreadMessage: (message: ChatMessage) => void
  clearUnreadMessages: () => void
  setChat: (chat: ChatMessage[]) => void
  sendMessage: (message: string, username: string) => void
  addSystemMessage: (message: string) => void
  mutedPlayers: string[]
  mutePlayer: (username: string) => void
  unmutePlayer: (username: string) => void
  toggleMutePlayer: (username: string) => void
  wizzPlayer: (targetUsername: string) => void
}

const ChatContext = createContext<ChatContext | undefined>(undefined)

const ChatProvider = ({ children }: PropsWithChildren) => {
  const { socket } = useSocket()
  const { username } = useUser()
  const {
    settings: { chatVisibility },
  } = useSettings()
  const t = useTranslations("utils.chat")
  const [chat, setChat] = useState<ChatMessage[]>([])

  const [unreadMessages, setUnreadMessages] = useState<ChatMessage[]>([])
  const [hasUnreadMessage, setHasUnreadMessage] = useState<boolean>(false)

  const [mutedPlayers, setMutedPlayers] = useState<string[]>([])

  useEffect(() => {
    if (!chatVisibility) return

    if (socket) {
      socket.on("message", onMessageReceived)
      socket.on("message:system", onSystemMessageReceived)
      socket.on("message:server", onServerMessageReceived)
      socket.on("wizz", onWizzReceived)
    }

    return () => {
      if (socket) {
        socket.off("message", onMessageReceived)
        socket.off("message:system", onSystemMessageReceived)
        socket.off("message:server", onServerMessageReceived)
        socket.off("wizz", onWizzReceived)
      }
    }
  }, [socket, chatVisibility, mutedPlayers])

  const sendMessage = (username: string, message: string) => {
    socket!.send({
      username,
      message,
    })
  }

  //#region Message received
  const onMessageReceived = (message: UserChatMessage) => {
    if (mutedPlayers.includes(message.username)) return

    messageSound.play()
    setChat((prev) => [message, ...prev])
  }

  const onServerMessageReceived = (message: ServerChatMessage) => {
    if (
      message.type === CoreConstants.SERVER_MESSAGE_TYPE.PLAYER_JOINED ||
      message.type === CoreConstants.SERVER_MESSAGE_TYPE.PLAYER_RECONNECT
    ) {
      playerJoinedSound.play()
    } else {
      playerLeftSound.play()
    }

    let messageContent: string

    if (
      message.type ===
      CoreConstants.SERVER_MESSAGE_TYPE.PLAYER_LEFT_CAN_RECONNECT
    ) {
      messageContent = t(message.message, {
        username: message.username,
        time: SharedConstants.LEAVE_TIMEOUT_IN_MS / 1000,
      })
    } else if (
      message.type ===
      CoreConstants.SERVER_MESSAGE_TYPE.PLAYER_TIMEOUT_CAN_RECONNECT
    ) {
      messageContent = t(message.message, {
        username: message.username,
        time: SharedConstants.CONNECTION_LOST_TIMEOUT_IN_MS / 1000,
      })
    } else {
      messageContent = t(message.message, {
        username: message.username,
      })
    }

    const chatMessage = {
      id: message.id,
      message: messageContent,
      type: message.type,
    } as ChatMessage

    setChat((prev) => [chatMessage, ...prev])
  }

  const onSystemMessageReceived = (message: SystemChatMessage) => {
    setChat((prev) => [message, ...prev])
  }

  const onWizzReceived = (
    targetUsername: string,
    initiatorUsername: string,
  ) => {
    if (targetUsername === username) {
      const wizzContainer = document.querySelector(".wizz-container")
      if (wizzContainer) {
        wizzContainer.classList.add("animate-wizz")
        setTimeout(() => {
          wizzContainer.classList.remove("animate-wizz")
        }, 2000)
      } else {
        console.error("Wizz container not found")
      }

      wizzSound.play()
      addSystemMessage(
        t("wizz-self", { initiatorUsername }),
        CoreConstants.SYSTEM_MESSAGE_TYPE.WARN_SYSTEM_MESSAGE,
      )
    } else {
      addSystemMessage(t("wizz-other", { targetUsername, initiatorUsername }))
    }
  }
  //#endregion

  const addSystemMessage = (
    message: string,
    type: SystemMessageType = CoreConstants.SYSTEM_MESSAGE_TYPE.SYSTEM_MESSAGE,
  ) => {
    const chatMessage: SystemChatMessage = {
      id: crypto.randomUUID(),
      message,
      type,
    }

    setChat((prev) => [chatMessage, ...prev])
  }

  const addUnreadMessage = (message: ChatMessage) => {
    setUnreadMessages((prev) => [message, ...prev])
    setHasUnreadMessage(true)
  }

  const clearUnreadMessages = () => setUnreadMessages([])

  //#region Mute functionality
  const mutePlayer = (username: string) => {
    if (!username) {
      addSystemMessage(
        t("argument-required", { command: "/mute" }),
        CoreConstants.SYSTEM_MESSAGE_TYPE.WARN_SYSTEM_MESSAGE,
      )
    } else if (mutedPlayers.includes(username)) {
      addSystemMessage(t("player-already-muted", { username }))
    } else {
      setMutedPlayers((prev) => [...prev, username])
      addSystemMessage(t("player-muted", { username }))
    }
  }

  const unmutePlayer = (username: string) => {
    if (!username) {
      addSystemMessage(
        t("argument-required", { command: "/unmute" }),
        CoreConstants.SYSTEM_MESSAGE_TYPE.WARN_SYSTEM_MESSAGE,
      )
    } else if (!mutedPlayers.includes(username)) {
      addSystemMessage(t("player-not-muted", { username }))
    } else {
      setMutedPlayers((prev) => prev.filter((user) => user !== username))
      addSystemMessage(t("player-unmuted", { username }))
    }
  }

  const toggleMutePlayer = (username: string) => {
    setMutedPlayers((prev) =>
      prev.includes(username)
        ? prev.filter((user) => user !== username)
        : [...prev, username],
    )
  }
  //#endregion

  //#region Wizz functionality
  const wizzPlayer = (targetUsername: string) => {
    if (!targetUsername) {
      addSystemMessage(
        t("argument-required", { command: "/wizz" }),
        CoreConstants.SYSTEM_MESSAGE_TYPE.WARN_SYSTEM_MESSAGE,
      )
    }

    socket!.emit("wizz", targetUsername)
    addSystemMessage(t("wizz-sent", { targetUsername }))
  }
  //#endregion

  const contextValue = useMemo(
    () => ({
      chat,
      unreadMessages,
      hasUnreadMessage,
      setHasUnreadMessage,
      addUnreadMessage,
      clearUnreadMessages,
      setChat,
      sendMessage,
      addSystemMessage,
      mutedPlayers,
      mutePlayer,
      unmutePlayer,
      toggleMutePlayer,
      wizzPlayer,
    }),
    [chat, unreadMessages, hasUnreadMessage, mutedPlayers],
  )

  return (
    <ChatContext.Provider value={contextValue}>
      <div className="wizz-container">{children}</div>
    </ChatContext.Provider>
  )
}

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) throw new Error("useChat must be used within a ChatProvider")
  return context
}

export default ChatProvider
