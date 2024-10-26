"use client"

import { useSettings } from "@/contexts/SettingsContext"
import { useSocket } from "@/contexts/SocketContext"
import { Constants as CoreConstants, SystemMessageType } from "@skyjo/core"
import {
  ChatMessage,
  ServerChatMessage,
  SystemChatMessage,
  UserChatMessage,
} from "@skyjo/shared/types/chat"
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
}

const ChatContext = createContext<ChatContext | undefined>(undefined)

const ChatProvider = ({ children }: PropsWithChildren) => {
  const { socket } = useSocket()
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
    }

    return () => {
      if (socket) {
        socket.off("message", onMessageReceived)
        socket.off("message:system", onSystemMessageReceived)
        socket.off("message:server", onServerMessageReceived)
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
    if (message.type === "player-joined") {
      playerJoinedSound.play()
    } else if (message.type === "player-left") {
      playerLeftSound.play()
    }

    const messageContent = t(message.message, {
      username: message.username,
    })

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
    }),
    [chat, unreadMessages, hasUnreadMessage, mutedPlayers],
  )

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  )
}

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) throw new Error("useChat must be used within a ChatProvider")
  return context
}

export default ChatProvider
