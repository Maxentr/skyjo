import ChatMessage from "@/components/ChatMessage"
import { useChat } from "@/contexts/ChatContext"
import { useTranslations } from "next-intl"

function ChatMessageList() {
  const { chat, unreadMessages } = useChat()
  const t = useTranslations("components.ChatMessageList")

  return (
    <div
      id="messages-container"
      className="w-full md:overflow-y-auto flex flex-grow flex-col-reverse my-2 gap-2 scrollbar-thin scrollbar-thumb-black scrollbar-track-transparent scrollbar-thumb-rounded-full scrollbar-track-rounded-full break-words"
    >
      {unreadMessages.map((message) => (
        <ChatMessage key={message.id} {...message} />
      ))}
      {unreadMessages.length > 0 && (
        <div className="sticky top-0 flex flex-row items-center bg-white dark:bg-dark-input">
          <hr className="flex-grow border-red-500 dark:border-red-600" />
          <p className="text-sm text-red-500 dark:text-red-600 px-2">
            {t("unread-messages", { count: unreadMessages.length })}
          </p>
          <hr className="flex-grow border-red-500 dark:border-red-600" />
        </div>
      )}
      {chat
        .filter((message) => !unreadMessages.includes(message))
        .map((message) => (
          <ChatMessage key={message.id} {...message} />
        ))}
    </div>
  )
}

export { ChatMessageList }
