"use client"

import { UserAvatar } from "@/components/UserAvatar"
import { Button } from "@/components/ui/button"
import {
  MotionTableHeader,
  MotionTableRow,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/table"
import { useSkyjo } from "@/contexts/SkyjoContext"
import { getConnectedPlayers } from "@/lib/skyjo"
import { cn, getRedirectionUrl } from "@/lib/utils"
import { useRouter } from "@/navigation"
import { Constants as CoreConstants, SkyjoPlayerToJson } from "@skyjo/core"
import { AnimatePresence, m } from "framer-motion"
import { CheckCircle2Icon, XCircleIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"

const ResultsPage = () => {
  const { player, game, actions } = useSkyjo()
  const router = useRouter()
  const t = useTranslations("pages.ResultsPage")
  const [visibleRows, setVisibleRows] = useState<SkyjoPlayerToJson[]>([])

  const sortedConnectedPlayers = game.players
    .filter(
      (player) =>
        player.connectionStatus === CoreConstants.CONNECTION_STATUS.CONNECTED,
    )
    .sort((a, b) => b.score - a.score)

  const sortedDisconnectedPlayers = game.players
    .filter(
      (player) =>
        player.connectionStatus !== CoreConstants.CONNECTION_STATUS.CONNECTED,
    )
    .sort((a, b) => b.score - a.score)

  const allRowsVisible = visibleRows.length >= sortedConnectedPlayers.length

  const connectedPlayers = getConnectedPlayers(game.players)
  const hasMoreThanOneConnectedPlayer = connectedPlayers.length > 1

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (visibleRows.length < sortedConnectedPlayers.length) {
      const nextPlayer = sortedConnectedPlayers[visibleRows.length]

      interval = setInterval(() => {
        if (nextPlayer) setVisibleRows((prev) => [nextPlayer, ...prev])
      }, 2000)
    } else if (visibleRows.length === sortedConnectedPlayers.length) {
      interval = setInterval(() => {
        setVisibleRows((prev) => [...prev, ...sortedDisconnectedPlayers])
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [visibleRows.length])

  useEffect(() => {
    if (game.status === CoreConstants.GAME_STATUS.STOPPED) return

    router.replace(getRedirectionUrl(game.code, game.status))
  }, [game.status])

  return (
    <AnimatePresence>
      <div className="ph-no-capture h-dvh w-dvw overflow-y-auto container py-10 flex lgh:items-center lgh:justify-center">
        <m.div
          className="h-fit w-full flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <h1 className="text-black dark:text-dark-font text-2xl font-semibold mb-4">
            {t("title")}
          </h1>
          <Table className="border-[1.5px] border-black dark:border-dark-border bg-container dark:bg-dark-container lg:w-2/3 mx-auto">
            {allRowsVisible && (
              <MotionTableHeader
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, display: "table-header-group" }}
                transition={{ delay: 0.2 }}
              >
                <TableRow>
                  <TableHead className="py-2 w-fit">{t("rank")}</TableHead>
                  <TableHead className="py-2 w-52">{t("player")}</TableHead>
                  <TableHead className="py-2">{t("score-per-round")}</TableHead>
                  <TableHead className="py-2 text-right">
                    {t("total")}
                  </TableHead>
                </TableRow>
              </MotionTableHeader>
            )}
            <TableBody>
              {visibleRows.map((player, index) => (
                <MotionTableRow
                  key={player.id}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.5 }}
                >
                  <TableCell className="w-8">
                    {player.connectionStatus ===
                    CoreConstants.CONNECTION_STATUS.CONNECTED
                      ? allRowsVisible && index + 1
                      : "-"}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "w-52 py-2 flex flex-row gap-2 items-center",
                      player.connectionStatus ===
                        CoreConstants.CONNECTION_STATUS.CONNECTED
                        ? "grayscale-0"
                        : "grayscale",
                    )}
                  >
                    <UserAvatar
                      player={player}
                      size="small"
                      showName={false}
                      allowContextMenu={false}
                    />
                    <p className="text-sm text-ellipsis overflow-hidden whitespace-nowrap">
                      {player.name}
                    </p>
                  </TableCell>
                  <TableCell className="py-2">
                    {player.scores.join(" ; ")}
                  </TableCell>
                  <TableCell className="py-2 text-right">
                    {player.score}
                  </TableCell>
                </MotionTableRow>
              ))}
            </TableBody>
          </Table>

          {allRowsVisible && (
            <m.div
              className="mt-2 flex flex-col items-center gap-4"
              initial={{ display: "none", opacity: 0 }}
              animate={{ opacity: 1, display: "flex" }}
              transition={{ delay: 1 }}
            >
              {hasMoreThanOneConnectedPlayer && (
                <div className="flex flex-col gap-1 items-center">
                  <p className="text-black dark:text-dark-font">
                    {t("player-want-to-replay")}
                  </p>
                  <div className="flex flex-row gap-1">
                    {connectedPlayers.map((player) =>
                      player.wantsReplay ? (
                        <CheckCircle2Icon
                          key={player.id}
                          size={24}
                          className="text-emerald-600"
                        />
                      ) : (
                        <XCircleIcon
                          key={player.id}
                          size={24}
                          className="text-black dark:text-dark-font"
                        />
                      ),
                    )}
                  </div>
                </div>
              )}
              <Button
                onClick={actions.replay}
                className={cn(
                  "w-full",
                  hasMoreThanOneConnectedPlayer ? "" : "mt-6",
                )}
              >
                {player.wantsReplay
                  ? t("replay-button.cancel")
                  : t("replay-button.replay")}
              </Button>
              <Button
                onClick={actions.leave}
                className={cn(
                  "w-full",
                  hasMoreThanOneConnectedPlayer ? "mt-6" : "mt-2",
                )}
              >
                {t("leave-button")}
              </Button>
            </m.div>
          )}
        </m.div>
      </div>
    </AnimatePresence>
  )
}

export default ResultsPage
