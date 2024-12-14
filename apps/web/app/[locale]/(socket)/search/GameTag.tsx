import type { PublicGameTag } from "@skyjo/shared/types"
import { cva } from "class-variance-authority"
import { m } from "framer-motion"
import { XIcon } from "lucide-react"
import { useTranslations } from "next-intl"

const tagVariants = cva(
  "select-none flex flex-row items-center rounded-full px-2.5 py-0.5 text-xs text-black font-medium cursor-pointer text-nowrap group",
  {
    variants: {
      tag: {
        classic: "bg-blue-300 dark:bg-blue-300/70",
        column: "bg-purple-300 dark:bg-purple-300/70",
        row: "bg-yellow-300 dark:bg-yellow-300/70",
        "short-game": "bg-green-300 dark:bg-green-300/70",
        "long-game": "bg-red-300 dark:bg-red-300/70",
      },
    },
  },
)

type GameTagProps = {
  tag: PublicGameTag
  showXIconOnHover?: boolean
  onClick: (tag: PublicGameTag) => void
}
const GameTag = ({ tag, onClick, showXIconOnHover = false }: GameTagProps) => {
  const t = useTranslations("pages.Search.tags.tag")

  return (
    <m.span
      key={tag}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.2 } }}
      exit={{ opacity: 0, transition: { duration: 0.2 } }}
      className={tagVariants({ tag })}
      onClick={() => onClick(tag)}
    >
      {t(`${tag}`)}

      {showXIconOnHover && (
        <XIcon className="size-3 group-hover:block hidden relative left-1" />
      )}
    </m.span>
  )
}

export { GameTag }
