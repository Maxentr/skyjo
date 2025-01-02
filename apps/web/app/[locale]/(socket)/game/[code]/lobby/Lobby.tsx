"use client"

import CopyLink from "@/components/CopyLink"
import MenuDropdown from "@/components/MenuDropdown"
import { UserAvatar } from "@/components/UserAvatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import RadioNumber from "@/components/ui/radio-number"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useSkyjo } from "@/contexts/SkyjoContext"
import { useRouter } from "@/i18n/routing"
import { getAdmin, isAdmin } from "@/lib/skyjo"
import { cn } from "@/lib/utils"
import { Constants as CoreConstants } from "@skyjo/core"
import { UpdateGameSettings } from "@skyjo/shared/validations"
import { m } from "framer-motion"
import {
  ArrowLeftIcon,
  LockIcon,
  TriangleAlertIcon,
  UnlockIcon,
} from "lucide-react"
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
    useLocalStorage<UpdateGameSettings>("gameSettings")

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

  const adminName = getAdmin(game)?.name ?? ""
  const adminNameSliced =
    adminName.length > 12 ? adminName.slice(0, 8) + "..." : adminName

  const disableInput =
    !admin || (!game.settings.private && game.settings.isConfirmed)

  const disableFlatPenalty =
    game.settings.firstPlayerPenaltyType ===
    CoreConstants.FIRST_PLAYER_PENALTY_TYPE.MULTIPLIER_ONLY

  const disableMultiplierPenalty =
    game.settings.firstPlayerPenaltyType ===
    CoreConstants.FIRST_PLAYER_PENALTY_TYPE.FLAT_ONLY

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
          <div className="bg-container dark:bg-dark-container border-2 border-black dark:border-dark-border rounded-2xl w-full">
            <div className="flex flex-row justify-between items-center mb-6 pt-4 sm:pt-8 px-4 sm:px-8">
              <button
                title={t(
                  game.settings.private
                    ? "leave-to-home"
                    : "leave-to-public-game-list",
                )}
                onClick={actions.leave}
                className="top-4 left-4 size-6 cursor-pointer text-black dark:text-dark-font"
              >
                <ArrowLeftIcon className="size-6" />
              </button>
              <h2 className="text-black dark:text-dark-font text-center text-2xl">
                {t("title", {
                  name: adminNameSliced,
                })}
              </h2>
              <TooltipProvider delayDuration={200}>
                <Tooltip defaultOpen={admin}>
                  <TooltipTrigger className="size-6 relative cursor-default text-black dark:text-dark-font">
                    {game.settings.private ? (
                      <LockIcon className="size-6" />
                    ) : (
                      <UnlockIcon className="size-6" />
                    )}
                  </TooltipTrigger>
                  <TooltipContent>
                    {game.settings.private
                      ? t("settings.private.tooltip.on")
                      : t("settings.private.tooltip.off")}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            <div className="flex flex-col gap-4 lg:gap-3 px-4 sm:px-8 overflow-y-scroll max-h-[30svh] lg:max-h-[50svh]">
              <div className="flex flex-row items-center gap-2">
                <Switch
                  id="skyjo-for-column"
                  checked={game.settings.allowSkyjoForColumn}
                  onCheckedChange={(checked) =>
                    actions.updateSingleSettings("allowSkyjoForColumn", checked)
                  }
                  disabled={disableInput}
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
                  disabled={disableInput}
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
                  max={CoreConstants.DEFAULT_GAME_SETTINGS.CARDS.PER_COLUMN}
                  selected={game.settings.cardPerColumn}
                  onChange={(value) =>
                    actions.updateSingleSettings("cardPerColumn", value)
                  }
                  title={t("settings.nb-columns.title")}
                  disabled={disableInput}
                  disabledRadioNumber={
                    game.settings.cardPerRow === 1 ? [1] : []
                  }
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="nb-rows">{t("settings.nb-rows.label")}</Label>
                <RadioNumber
                  name="nb-rows"
                  max={CoreConstants.DEFAULT_GAME_SETTINGS.CARDS.PER_ROW}
                  selected={game.settings.cardPerRow}
                  onChange={(value) =>
                    actions.updateSingleSettings("cardPerRow", value)
                  }
                  title={t("settings.nb-rows.title")}
                  disabled={disableInput}
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
                    disabled={disableInput}
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
                    disabled={disableInput}
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
                    disabled={disableInput}
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
                    disabled={disableInput}
                    className="w-20 text-center"
                  />
                </div>
              </div>
              <hr className="w-full border-black dark:border-dark-border my-3" />
              <div className="flex flex-col gap-1">
                <Label htmlFor="first-player-penalty-type">
                  {t("settings.first-player-penalty-type.label")}
                </Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t("settings.first-player-penalty-type.description")}
                </p>
                <Select
                  value={game.settings.firstPlayerPenaltyType.toString()}
                  onValueChange={(value) =>
                    actions.updateSingleSettings(
                      "firstPlayerPenaltyType",
                      +value,
                    )
                  }
                  disabled={disableInput}
                >
                  <SelectTrigger className="mt-2 w-fit">
                    <SelectValue
                      placeholder={t(
                        "settings.first-player-penalty-type.placeholder",
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value={CoreConstants.FIRST_PLAYER_PENALTY_TYPE.MULTIPLIER_ONLY.toString()}
                    >
                      {t(
                        "settings.first-player-penalty-type.item.multiplier-only",
                      )}
                    </SelectItem>
                    <SelectItem
                      value={CoreConstants.FIRST_PLAYER_PENALTY_TYPE.FLAT_ONLY.toString()}
                    >
                      {t("settings.first-player-penalty-type.item.flat-only")}
                    </SelectItem>
                    <SelectItem
                      value={CoreConstants.FIRST_PLAYER_PENALTY_TYPE.FLAT_THEN_MULTIPLIER.toString()}
                    >
                      {t(
                        "settings.first-player-penalty-type.item.flat-then-multiplier",
                      )}
                    </SelectItem>
                    <SelectItem
                      value={CoreConstants.FIRST_PLAYER_PENALTY_TYPE.MULTIPLIER_THEN_FLAT.toString()}
                    >
                      {t(
                        "settings.first-player-penalty-type.item.multiplier-then-flat",
                      )}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="first-player-multiplier-penalty">
                  {t("settings.first-player-multiplier-penalty.label")}
                </Label>
                <div className="flex flex-row gap-2 items-center">
                  <Slider
                    key={game.settings.firstPlayerMultiplierPenalty}
                    name={"first-player-multiplier-penalty"}
                    step={1}
                    min={1}
                    max={10}
                    defaultValue={[game.settings.firstPlayerMultiplierPenalty]}
                    onValueCommit={(value) =>
                      actions.updateSingleSettings(
                        "firstPlayerMultiplierPenalty",
                        +value,
                      )
                    }
                    title={t("settings.first-player-multiplier-penalty.title", {
                      number: game.settings.firstPlayerMultiplierPenalty,
                    })}
                    disabled={disableInput || disableMultiplierPenalty}
                  />
                  <Input
                    name={"first-player-multiplier-penalty"}
                    type="number"
                    min={1}
                    max={10}
                    value={game.settings.firstPlayerMultiplierPenalty}
                    onChange={(e) =>
                      actions.updateSingleSettings(
                        "firstPlayerMultiplierPenalty",
                        +e.target.value,
                      )
                    }
                    title={t("settings.first-player-multiplier-penalty.title", {
                      number: game.settings.firstPlayerMultiplierPenalty,
                    })}
                    disabled={disableInput || disableMultiplierPenalty}
                    className="w-16 text-center"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Label htmlFor="first-player-flat-penalty">
                  {t("settings.first-player-flat-penalty.label")}
                </Label>
                <div className="flex flex-row gap-2 items-center">
                  <Slider
                    key={game.settings.firstPlayerFlatPenalty}
                    name={"first-player-flat-penalty"}
                    step={1}
                    min={1}
                    max={10}
                    defaultValue={[game.settings.firstPlayerFlatPenalty]}
                    onValueCommit={(value) =>
                      actions.updateSingleSettings(
                        "firstPlayerFlatPenalty",
                        +value,
                      )
                    }
                    title={t("settings.first-player-flat-penalty.title", {
                      number: game.settings.firstPlayerFlatPenalty,
                    })}
                    disabled={disableInput || disableFlatPenalty}
                  />
                  <Input
                    name={"first-player-flat-penalty"}
                    type="number"
                    min={1}
                    max={10}
                    value={game.settings.firstPlayerFlatPenalty}
                    onChange={(e) =>
                      actions.updateSingleSettings(
                        "firstPlayerFlatPenalty",
                        +e.target.value,
                      )
                    }
                    title={t("settings.first-player-flat-penalty.title", {
                      number: game.settings.firstPlayerFlatPenalty,
                    })}
                    disabled={disableInput || disableFlatPenalty}
                    className="w-16 text-center"
                  />
                </div>
              </div>
            </div>
            {admin && !game.settings.private && (
              <div className="flex flex-row justify-center gap-1 mt-6 px-4 sm:px-8">
                <TriangleAlertIcon className="size-5 text-red-500 dark:text-red-600" />
                <p className="text-sm text-red-500 dark:text-red-600">
                  {t("settings.validation-warning")}
                </p>
              </div>
            )}
            {admin ? (
              <div
                className={cn(
                  "flex flex-col sm:flex-row justify-center items-center gap-4 lg:gap-8 px-4 sm:px-8 mb-4 sm:mb-8",
                  game.settings.private ? "mt-6 lg:mt-8" : "mt-4",
                )}
              >
                {(game.settings.private || !game.settings.isConfirmed) && (
                  <Button
                    onClick={actions.resetSettings}
                    className="bg-slate-200"
                  >
                    {t("settings.reset-settings")}
                  </Button>
                )}
                {!game.settings.isConfirmed ? (
                  <Button onClick={actions.toggleSettingsValidation}>
                    {t("settings.validate-settings")}
                  </Button>
                ) : (
                  <Button
                    onClick={beforeStartGame}
                    disabled={hasMinPlayers || !admin}
                    loading={isLoading}
                  >
                    {t("start-game-button")}
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-center text-black dark:text-dark-font mt-6 lg:mt-8 px-4 sm:px-8 mb-4 sm:mb-8">
                {t(
                  game.settings.isConfirmed
                    ? "waiting-admin-to-start"
                    : "waiting-admin-to-confirm-game-settings",
                )}
              </p>
            )}
          </div>
          <div className="block bg-container dark:bg-dark-container border-2 border-black dark:border-dark-border rounded-2xl w-full lg:w-80 p-4 lg:p-8">
            <h3 className="text-black dark:text-dark-font text-center text-xl">
              {t("player-section.title", {
                nbPlayers: game.players.length,
                maxPlayers: game.settings.maxPlayers,
              })}
            </h3>
            {admin && (
              <Select
                value={game.settings.maxPlayers.toString()}
                onValueChange={(value) =>
                  actions.updateSingleSettings("maxPlayers", +value)
                }
                disabled={disableInput}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue
                    placeholder={t("player-section.select.placeholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(
                    {
                      length:
                        CoreConstants.DEFAULT_GAME_SETTINGS.MAX_PLAYERS - 1,
                    },
                    (_, index) =>
                      index + CoreConstants.DEFAULT_GAME_SETTINGS.MIN_PLAYERS,
                  ).map((value) => (
                    <SelectItem key={value} value={value.toString()}>
                      {t("player-section.select.item", { value })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="flex flex-row flex-wrap justify-center gap-2 mt-2 lg:mt-5">
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
