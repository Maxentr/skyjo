"use client"

import CopyLink from "@/components/CopyLink"
import MenuDropdown from "@/components/MenuDropdown"
import { UserAvatar } from "@/components/UserAvatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import RadioNumber from "@/components/ui/radio-number"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useSkyjo } from "@/contexts/SkyjoContext"
import { isAdmin } from "@/lib/skyjo"
import { cn } from "@/lib/utils"
import { useRouter } from "@/navigation"
import { Constants as CoreConstants } from "@skyjo/core"
import { GameSettings } from "@skyjo/shared/validations"
import { m } from "framer-motion"
import { HomeIcon, LockIcon, UnlockIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { useLocalStorage } from "react-use"

type LobbyProps = {
  gameCode: string
}

const Lobby = ({ gameCode }: LobbyProps) => {
  const t = useTranslations("pages.Lobby")
  const { player, game, actions } = useSkyjo()
  const router = useRouter()
  const [gameSettingsLocalStorage, setGameSettingsLocalStorage] =
    useLocalStorage<GameSettings>("gameSettings")

  const [isLoading, setIsLoading] = useState(false)

  const admin = isAdmin(game, player?.id)
  const hasMinPlayers = game.players.length < 2
  const nbCards = game.settings.cardPerColumn * game.settings.cardPerRow
  const maxInitialTurnedCount = nbCards === 1 ? 1 : nbCards - 1
  let timeoutStart: NodeJS.Timeout

  useEffect(() => {
    const oldSettings = localStorage.getItem("settings")
    if (oldSettings) {
      const parsedOldSettings = JSON.parse(oldSettings)
      setGameSettingsLocalStorage(parsedOldSettings)

      localStorage.removeItem("settings")
    }

    if (gameSettingsLocalStorage) {
      const newSettings = { ...gameSettingsLocalStorage }
      if (gameSettingsLocalStorage.private !== game.settings.private)
        newSettings.private = game.settings.private

      actions.updateSettings(newSettings)
    }
  }, [])

  useEffect(() => {
    if (game.status !== CoreConstants.GAME_STATUS.LOBBY) {
      clearTimeout(timeoutStart)
      router.replace(`/game/${gameCode}`)
    }
  }, [game.status])

  const beforeStartGame = () => {
    if (isLoading) return

    setIsLoading(true)
    setGameSettingsLocalStorage(game.settings)

    actions.startGame()

    timeoutStart = setTimeout(() => setIsLoading(false), 5000)
  }

  return (
    <m.div
      className="relative h-svh w-full z-20 flex flex-col md:items-center mdh:md:justify-center overflow-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="w-full pt-4 px-4 flex justify-end lgh:md:absolute lgh:md:top-0 lgh:md:right-0">
        <MenuDropdown />
      </div>
      <div className="flex flex-col gap-4 md:gap-8 items-center h-fit w-full md:max-w-3xl lg:max-w-4xl p-4 pb-20 md:pb-4">
        <div className="flex flex-col lg:flex-row gap-4 w-full">
          <div className="bg-container dark:bg-dark-container border-2 border-black dark:border-dark-border rounded-2xl w-full px-8 md:px-12 py-8 relative">
            <HomeIcon
              className="absolute top-4 left-4 h-6 w-6 text-black dark:text-dark-font cursor-pointer"
              onClick={actions.leave}
            />
            <span className="absolute top-4 right-4">
              <TooltipProvider delayDuration={200}>
                <Tooltip defaultOpen={admin}>
                  <TooltipTrigger className="relative">
                    {game.settings.private ? (
                      <LockIcon
                        className={cn(
                          "h-6 w-6 text-black dark:text-dark-font",
                          admin ? "cursor-pointer" : "cursor-not-allowed",
                        )}
                        onClick={() =>
                          actions.updateSingleSettings("private", false)
                        }
                      />
                    ) : (
                      <UnlockIcon
                        className={cn(
                          "h-6 w-6 text-black dark:text-dark-font",
                          !admin && "cursor-default",
                        )}
                        onClick={() =>
                          actions.updateSingleSettings("private", true)
                        }
                      />
                    )}
                  </TooltipTrigger>
                  <TooltipContent>
                    {game.settings.private
                      ? t("settings.private.tooltip.on")
                      : t("settings.private.tooltip.off")}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </span>
            <h2 className="text-black dark:text-dark-font text-center text-2xl mb-2 lg:mb-5">
              {t("settings.title")}
            </h2>

            <div className="flex flex-col gap-4 lg:gap-3">
              <div className="flex flex-row items-center gap-2">
                <Switch
                  id="skyjo-for-column"
                  checked={game.settings.allowSkyjoForColumn}
                  onCheckedChange={(checked) =>
                    actions.updateSingleSettings("allowSkyjoForColumn", checked)
                  }
                  disabled={!admin}
                  title={t("settings.allow-skyjo-for-column")}
                />
                <Label htmlFor="skyjo-for-column">
                  {t("settings.allow-skyjo-for-column")}
                </Label>
              </div>
              <div className="flex flex-row items-center gap-2">
                <Switch
                  id="skyjo-for-row"
                  checked={game.settings.allowSkyjoForRow}
                  onCheckedChange={(checked) =>
                    actions.updateSingleSettings("allowSkyjoForRow", checked)
                  }
                  disabled={!admin}
                  title={t("settings.allow-skyjo-for-row")}
                />
                <Label htmlFor="skyjo-for-row">
                  {t("settings.allow-skyjo-for-row")}
                </Label>
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="nb-columns">
                  {t("settings.nb-columns.label")}
                </Label>
                <RadioNumber
                  name="nb-columns"
                  max={CoreConstants.SKYJO_DEFAULT_SETTINGS.CARDS.PER_COLUMN}
                  selected={game.settings.cardPerColumn}
                  onChange={(value) =>
                    actions.updateSingleSettings("cardPerColumn", value)
                  }
                  title={t("settings.nb-columns.title")}
                  disabled={!admin}
                  disabledRadioNumber={
                    game.settings.cardPerRow === 1 ? [1] : []
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="nb-rows">{t("settings.nb-rows.label")}</Label>
                <RadioNumber
                  name="nb-rows"
                  max={CoreConstants.SKYJO_DEFAULT_SETTINGS.CARDS.PER_ROW}
                  selected={game.settings.cardPerRow}
                  onChange={(value) =>
                    actions.updateSingleSettings("cardPerRow", value)
                  }
                  title={t("settings.nb-rows.title")}
                  disabled={!admin}
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="initial-turned-count">
                  {t("settings.initial-turned-count.label")}
                </Label>
                <div className="flex flex-row gap-2 items-center">
                  <Slider
                    key={game.settings.initialTurnedCount}
                    name={"initial-turned-count"}
                    step={1}
                    min={0}
                    max={maxInitialTurnedCount}
                    defaultValue={[game.settings.initialTurnedCount]}
                    onValueCommit={(value) =>
                      actions.updateSingleSettings("initialTurnedCount", +value)
                    }
                    title={t("settings.initial-turned-count.title", {
                      number: game.settings.initialTurnedCount,
                    })}
                    disabled={!admin}
                  />
                  <Input
                    name={"initial-turned-count"}
                    type="number"
                    min={0}
                    max={maxInitialTurnedCount}
                    value={game.settings.initialTurnedCount}
                    onChange={(e) =>
                      actions.updateSingleSettings(
                        "initialTurnedCount",
                        +e.target.value,
                      )
                    }
                    title={t("settings.initial-turned-count.title", {
                      number: game.settings.initialTurnedCount,
                    })}
                    disabled={!admin}
                    className="w-16 text-center"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="multiplier-for-first-player">
                  {t("settings.multiplier-for-first-player.label")}
                </Label>
                <div className="flex flex-row gap-2 items-center">
                  <Slider
                    key={game.settings.multiplierForFirstPlayer}
                    name={"multiplier-for-first-player"}
                    step={1}
                    min={1}
                    max={10}
                    defaultValue={[game.settings.multiplierForFirstPlayer]}
                    onValueCommit={(value) =>
                      actions.updateSingleSettings(
                        "multiplierForFirstPlayer",
                        +value,
                      )
                    }
                    title={t("settings.multiplier-for-first-player.title", {
                      number: game.settings.multiplierForFirstPlayer,
                    })}
                    disabled={!admin}
                  />
                  <Input
                    name={"multiplier-for-first-player"}
                    type="number"
                    min={1}
                    max={10}
                    value={game.settings.multiplierForFirstPlayer}
                    onChange={(e) =>
                      actions.updateSingleSettings(
                        "multiplierForFirstPlayer",
                        +e.target.value,
                      )
                    }
                    title={t("settings.multiplier-for-first-player.title", {
                      number: game.settings.multiplierForFirstPlayer,
                    })}
                    disabled={!admin}
                    className="w-16 text-center"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="score-to-end-game">
                  {t("settings.score-to-end-game.label")}
                </Label>
                <div className="flex flex-row gap-2 items-center">
                  <Slider
                    key={game.settings.scoreToEndGame}
                    name={"score-to-end-game"}
                    step={10}
                    min={10}
                    max={1000}
                    defaultValue={[game.settings.scoreToEndGame]}
                    onValueCommit={(value) =>
                      actions.updateSingleSettings("scoreToEndGame", +value)
                    }
                    title={t("settings.score-to-end-game.title", {
                      number: game.settings.scoreToEndGame,
                    })}
                    disabled={!admin}
                  />
                  <Input
                    name={"score-to-end-game"}
                    type="number"
                    min={10}
                    max={1000}
                    value={game.settings.scoreToEndGame}
                    onChange={(e) =>
                      actions.updateSingleSettings(
                        "scoreToEndGame",
                        +e.target.value,
                      )
                    }
                    title={t("settings.score-to-end-game.title", {
                      number: game.settings.scoreToEndGame,
                    })}
                    disabled={!admin}
                    className="w-20 text-center"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 lg:gap-8 mt-6 lg:mt-8">
              {admin && (
                <Button
                  onClick={actions.resetSettings}
                  className="bg-slate-200"
                >
                  {t("settings.reset-settings")}
                </Button>
              )}
              <Button
                onClick={beforeStartGame}
                disabled={hasMinPlayers || !admin}
                loading={isLoading}
              >
                {t("start-game-button")}
              </Button>
            </div>
          </div>
          <div className="block bg-container dark:bg-dark-container border-2 border-black dark:border-dark-border rounded-2xl w-full lg:w-80 p-4 lg:p-8">
            <h3 className="text-black dark:text-dark-font text-center text-xl mb-2 lg:mb-5">
              {t("player-section.title")}
            </h3>
            <div className="flex flex-row flex-wrap justify-center gap-2">
              {game.players.map((player) => (
                <UserAvatar key={player.id} player={player} size="small" />
              ))}
            </div>
          </div>
        </div>
        <CopyLink gameCode={gameCode} />
      </div>
    </m.div>
  )
}

export default Lobby
