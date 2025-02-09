import { useSkyjo } from "@/contexts/SkyjoContext"
import type { ChatMessage } from "@skyjo/shared/types"
import { cva } from "class-variance-authority"
import { m } from "framer-motion"
import { useTranslations } from "next-intl"

const chatMessageClasses = cva("text-sm text-wrap break-words md:break-all", {
  variants: {
    type: {
      message: "text-black dark:text-dark-font",
      "player-joined": " text-green-600 ",
      "player-reconnect": " text-green-600 ",
      "player-left": " text-red-600 ",
      "player-left-can-reconnect": " text-amber-600 ",
      "player-reconnection-expired": " text-red-600 ",
      wizz: " text-purple-600",
      "system-message": " text-blue-500 ",
      "success-system-message": " text-green-600 ",
      "warn-system-message": " text-orange-500 ",
      "error-system-message": " text-red-600 ",
    },
  },
})
type ChatMessageProps = Readonly<ChatMessage> & {
  username?: string
}

const ChatMessage = ({ username, message, type }: ChatMessageProps) => {
  const { game } = useSkyjo()
  const t = useTranslations("components.ChatMessage")
  const players = game?.players.map((p) => p.name)

  const highlightTags = (text: string) => {
    const parts = text.split(/(@[\w-]+)/)

    return parts.map((part) => {
      if (part.startsWith("@") && players.includes(part.slice(1))) {
        return (
          <span key={part} className="font-semibold text-blue-500 ">
            {part}
          </span>
        )
      }
      return part
    })
  }

  return (
    <m.p
      initial={{
        opacity: 0.5,
        translateY: 10,
      }}
      animate={{
        opacity: 1,
        translateY: 0,
      }}
      className={chatMessageClasses({ type })}
    >
      {username && (
        <span className="font-semibold">
          {username}
          {t("separator")}
        </span>
      )}
      {highlightTags(message)}
    </m.p>
  )
}

export default ChatMessage
