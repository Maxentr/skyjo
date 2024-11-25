import { UserContextMenu } from "@/components/UserContextMenu"
import { ContextMenu, ContextMenuTrigger } from "@/components/ui/context-menu"
import { useSkyjo } from "@/contexts/SkyjoContext"
import { cn } from "@/lib/utils"
import { SkyjoPlayerToJson } from "@skyjo/core"
import { VariantProps, cva } from "class-variance-authority"
import { useTranslations } from "next-intl"
import Image from "next/image"

const containerVariants = cva("flex flex-col items-center", {
  variants: {
    size: {
      small: " gap-0",
      normal: " gap-2",
    },
  },
  defaultVariants: {
    size: "normal",
  },
})

// Ajouter une sdh pour le mobile pour que la taille soit plus adaptée
const imageVariants = cva("select-none", {
  variants: {
    size: {
      small: " size-8 sm:size-10",
      normal: " size-12 smh:sm:size-16 mdh:md:size-[6.25rem]",
    },
  },
  defaultVariants: {
    size: "normal",
  },
})

const textVariants = cva(
  "text-black dark:text-dark-font text-center text-ellipsis overflow-hidden whitespace-nowrap",
  {
    variants: {
      size: {
        small: "text-sm w-20",
        normal: "text-lg w-[6.25rem]",
      },
    },
    defaultVariants: {
      size: "normal",
    },
  },
)

interface UserAvatarProps extends VariantProps<typeof containerVariants> {
  player: SkyjoPlayerToJson
  allowContextMenu?: boolean
  showName?: boolean
  animate?: boolean
}

const UserAvatar = ({
  player,
  size = "normal",
  allowContextMenu = true,
  showName = true,
  animate = false,
}: UserAvatarProps) => {
  const tAvatar = useTranslations("utils.avatar")
  const { player: currentPlayer } = useSkyjo()

  const isCurrentPlayer = currentPlayer.socketId === player.socketId
  const disableContextMenu =
    !allowContextMenu || !player.name || isCurrentPlayer

  return (
    <ContextMenu>
      <ContextMenuTrigger
        disabled={disableContextMenu}
        className={containerVariants({ size })}
      >
        <Image
          src={`/avatars/${player.avatar}.svg`}
          width={size === "small" ? 40 : 100}
          height={size === "small" ? 40 : 100}
          alt={tAvatar(player.avatar)}
          title={tAvatar(player.avatar)}
          className={cn(
            imageVariants({ size }),
            "dark:opacity-75",
            animate && "animate-small-bounce",
          )}
          priority
        />
        {player.name && showName && (
          <p className={textVariants({ size })}>{player.name}</p>
        )}
      </ContextMenuTrigger>
      {!disableContextMenu && <UserContextMenu player={player} />}
    </ContextMenu>
  )
}
export { UserAvatar }
