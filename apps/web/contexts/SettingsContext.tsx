"use client"

import SettingsDialog from "@/components/SettingsDialog"
import { Locales } from "@/i18n/routing"
import { Howler } from "howler"
import { ThemeProvider } from "next-themes"
import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useLocalStorage } from "react-use"

const VOLUME_DIVISOR = 100

export const ChatNotificationSize = {
  SMALL: "small",
  NORMAL: "normal",
  BIG: "big",
} as const
export type ChatNotificationSize =
  (typeof ChatNotificationSize)[keyof typeof ChatNotificationSize]

export const Appearance = {
  LIGHT: "light",
  DARK: "dark",
  SYSTEM: "system",
} as const
export type Appearance = (typeof Appearance)[keyof typeof Appearance]

type Settings = {
  chatVisibility: boolean
  chatNotificationSize: ChatNotificationSize
  locale: Locales
  switchToPlayerWhoIsPlaying: boolean
  audio: boolean
  volume: number
}
type SettingsKeys = keyof Settings

const DEFAULT_SETTINGS: Settings = {
  chatVisibility: true,
  chatNotificationSize: ChatNotificationSize.NORMAL,
  locale: "en",
  switchToPlayerWhoIsPlaying: true,
  audio: true,
  volume: 50,
}

type SettingsContext = {
  settings: Settings
  openSettings: () => void
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void
}
const SettingsContext = createContext<SettingsContext | undefined>(undefined)

type SettingsProviderProps = PropsWithChildren<{ locale: Locales }>
const SettingsProvider = ({ children, locale }: SettingsProviderProps) => {
  const [settings, setSettings] = useLocalStorage<Settings>("userSettings", {
    ...DEFAULT_SETTINGS,
    locale,
  })

  const [open, setOpen] = useState(false)

  useEffect(() => {
    // check all settings keys, if not present in settings, add them
    if (!settings) return

    Object.keys(settings).forEach((key) => {
      const k = key as SettingsKeys

      if (settings[k] === undefined)
        setSettings({ ...settings, [k]: DEFAULT_SETTINGS[k] })
    })
  }, [settings])

  useEffect(() => {
    if (settings) Howler.mute(!settings.audio)
  }, [settings?.audio])

  useEffect(() => {
    if (settings) Howler.volume((settings.volume ?? 50) / VOLUME_DIVISOR)
  }, [settings?.volume])

  useEffect(() => {
    if (settings) setSettings({ ...settings, locale })
  }, [locale])

  const openSettings = () => setOpen(true)

  const updateSetting = <K extends keyof Settings>(
    key: K,
    value: Settings[K],
  ) => {
    if (settings) setSettings({ ...settings, [key]: value })
  }

  const contextValue = useMemo(
    () => ({
      settings: settings!,
      openSettings,
      updateSetting,
    }),
    [settings, openSettings, updateSetting],
  )

  return (
    <SettingsContext.Provider value={contextValue}>
      <ThemeProvider attribute="class" enableSystem>
        {children}
        <SettingsDialog open={open} onOpenChange={setOpen} />
      </ThemeProvider>
    </SettingsContext.Provider>
  )
}

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider")
  }
  return context
}

export default SettingsProvider
