"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useRules } from "@/contexts/RulesContext"
import { useSettings } from "@/contexts/SettingsContext"
import {
  BookOpenIcon,
  MenuIcon,
  SettingsIcon,
  SquareArrowOutUpRightIcon,
} from "lucide-react"
import { useTranslations } from "next-intl"
import Image from "next/image"

const MenuDropdown = () => {
  const { openRules } = useRules()
  const { openSettings } = useSettings()
  const t = useTranslations("components.MenuDropdown")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="icon" aria-label={t("button.aria-label")}>
          <MenuIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="mr-6">
        <DropdownMenuItem onClick={openRules}>
          <BookOpenIcon className="mr-2 h-4 w-4" />
          <span>{t("rules")}</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <a
            href="https://discord.gg/uSmGjhzZAE"
            target="_blank"
            className="flex items-center justify-between w-full"
          >
            <div className="flex items-center">
              <Image
                src="/svg/discord-outline.svg"
                width={16}
                height={16}
                alt="Discord server invite icon"
                className="dark:invert mr-2"
              />
              <span>{t("discord")}</span>
            </div>
            <SquareArrowOutUpRightIcon className="size-3.5 opacity-50" />
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={openSettings}>
          <SettingsIcon className="mr-2 h-4 w-4" />
          <span>{t("settings")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default MenuDropdown
