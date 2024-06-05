import { CardTable } from "@/components/CardTable"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { AlertTriangleIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { SkyjoPlayerToJson } from "shared/types/skyjoPlayer"

type OpponentBoardProps = {
  opponent: SkyjoPlayerToJson
  isPlayerTurn: boolean
}

const OpponentBoard = ({ opponent, isPlayerTurn }: OpponentBoardProps) => {
  const ta = useTranslations("components.Avatar")
  const to = useTranslations("components.OpponentBoard")

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-start duration-300 ease-in-out w-full h-full",
      )}
    >
      <Image
        src={`/avatars/${opponent.avatar}.png`}
        width={32}
        height={32}
        alt={ta(opponent.avatar)}
        title={ta(opponent.avatar)}
        className={cn("select-none", isPlayerTurn && "animate-bounce")}
        priority
      />
      <p
        className={cn(
          "text-center select-none text-sm mb-2 flex flex-row items-center gap-1",
          isPlayerTurn && "font-semibold",
        )}
      >
        {opponent.name}
        {opponent.connectionStatus === "connection-lost" && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger className="relative">
                <AlertTriangleIcon size={16} className="text-yellow-700" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{to("connection-lost")}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </p>
      <CardTable
        testId={opponent.name}
        cards={opponent.cards}
        cardDisabled={true}
      />
    </div>
  )
}

export default OpponentBoard
