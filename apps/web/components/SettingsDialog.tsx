"use client"

import { AppearanceSelect } from "@/components/AppearanceSelect"
import { LanguageCombobox } from "@/components/LanguageCombobox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChatNotificationSize,
  GameBoardSize,
  useSettings,
} from "@/contexts/SettingsContext"
import { useTranslations } from "next-intl"
import { Dispatch, SetStateAction } from "react"

type SettingsDialogProps = {
  open: boolean
  onOpenChange: Dispatch<SetStateAction<boolean>>
}

const SettingsDialog = ({ open, onOpenChange }: SettingsDialogProps) => {
  const t = useTranslations("components.SettingsDialog")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[70svh] px-0 pb-1.5 bg-body dark:bg-dark-body flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">
            {t("title")}
          </DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <Tabs
          defaultValue="general"
          className="flex flex-col flex-grow overflow-y-auto"
        >
          <TabsList className="px-6 flex">
            <TabsTrigger value="general">{t("general.title")}</TabsTrigger>
            <TabsTrigger value="audio">{t("audio.title")}</TabsTrigger>
            <TabsTrigger value="display">{t("display.title")}</TabsTrigger>
          </TabsList>
          <TabsContent value="general">
            <GeneralSettings />
          </TabsContent>
          <TabsContent value="audio">
            <AudioSettings />
          </TabsContent>
          <TabsContent value="display">
            <DisplaySettings />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

const GeneralSettings = () => {
  const t = useTranslations("components.SettingsDialog.general")

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>
          {t("language")} ({t("language-warn")})
        </Label>
        <LanguageCombobox />
      </div>
      <div className="flex flex-col gap-2">
        <Label>{t("appearance")}</Label>
        <AppearanceSelect />
      </div>
    </div>
  )
}

const AudioSettings = () => {
  const t = useTranslations("components.SettingsDialog.audio")
  const { settings, updateSetting } = useSettings()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="sound-enabled">{t("toggle.label")}</Label>
        <Switch
          id="sound-enabled"
          checked={settings.audio ?? true}
          onCheckedChange={(value) => updateSetting("audio", value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label>{t("volume.label", { volume: settings.volume })}</Label>
        <Slider
          value={[settings.volume ?? 50]}
          onValueChange={(value) => updateSetting("volume", value[0])}
          min={0}
          max={100}
          step={1}
          disabled={!settings.audio}
        />
      </div>
    </div>
  )
}

const DisplaySettings = () => {
  const t = useTranslations("components.SettingsDialog.display")
  const { settings, updateSetting } = useSettings()

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{t("chat.title")}</h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="chat-visibility">{t("chat.chat-visibility")}</Label>
            <Switch
              id="chat-visibility"
              checked={settings.chatVisibility}
              onCheckedChange={(value) =>
                updateSetting("chatVisibility", value)
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>{t("chat.chat-notification-size.label")}</Label>
            <RadioGroup
              value={settings.chatNotificationSize}
              onValueChange={(value) =>
                updateSetting(
                  "chatNotificationSize",
                  value as ChatNotificationSize,
                )
              }
              disabled={!settings.chatVisibility}
              className="flex gap-4"
            >
              {Object.values(ChatNotificationSize).map((size) => (
                <div className="flex items-center space-x-2" key={size}>
                  <RadioGroupItem value={size} id={size} />
                  <Label htmlFor={size}>
                    {t(`chat.chat-notification-size.values.${size}`)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{t("mobile.title")}</h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="switch-to-player-who-is-playing">
              {t("mobile.switch-to-player-who-is-playing")}
            </Label>
            <Switch
              id="switch-to-player-who-is-playing"
              checked={settings.switchToPlayerWhoIsPlaying}
              onCheckedChange={(value) =>
                updateSetting("switchToPlayerWhoIsPlaying", value)
              }
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="show-preview-opponents-cards">
              {t("mobile.show-preview-opponents-cards")}
            </Label>
            <Switch
              id="show-preview-opponents-cards"
              checked={settings.showPreviewOpponentsCardsForMobile}
              onCheckedChange={(value) =>
                updateSetting("showPreviewOpponentsCardsForMobile", value)
              }
            />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">{t("game-board.title")}</h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div>
              <Label>{t("game-board.size.label")}</Label>
              {settings.gameBoardSize === GameBoardSize.BIG && (
                <p className="text-xs text-orange-600">
                  {t("game-board.size.big-warning")}
                </p>
              )}
            </div>
            <RadioGroup
              value={settings.gameBoardSize}
              onValueChange={(value) =>
                updateSetting("gameBoardSize", value as GameBoardSize)
              }
              className="flex gap-4"
            >
              {Object.values(GameBoardSize).map((size) => (
                <div className="flex items-center space-x-2" key={size}>
                  <RadioGroupItem value={size} id={size} />
                  <Label htmlFor={size}>
                    {t(`game-board.size.values.${size}`)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsDialog
