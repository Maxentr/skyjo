"use client"

import GameLobbyButtons from "@/components/GameLobbyButtons"
import SelectAvatar from "@/components/SelectAvatar"
import { Input } from "@/components/ui/input"
import { useUser } from "@/contexts/UserContext"
import { CreatePlayer } from "@skyjo/core"
import { useTranslations } from "next-intl"
import { ChangeEvent } from "react"

type Props = {
  searchParams: {
    gameCode?: string
  }
}

const IndexPage = ({ searchParams }: Props) => {
  const t = useTranslations("pages.Index")
  const { username, getAvatar, setUsername, saveUserInLocalStorage } = useUser()

  const beforeButtonAction = () => {
    saveUserInLocalStorage()

    if (!username) return

    const player: CreatePlayer = {
      username,
      avatar: getAvatar(),
    }

    return player
  }

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const newValue = value.replace(/ /g, "_")

    setUsername(newValue)
  }

  return (
    <>
      <SelectAvatar containerClassName="mb-4" />
      <Input
        placeholder={t("name-input-placeholder")}
        value={username}
        maxLength={20}
        onChange={onChange}
        autoCapitalize="none"
        autoComplete="off"
        autoCorrect="off"
      />
      <GameLobbyButtons
        beforeButtonAction={beforeButtonAction}
        gameCode={searchParams.gameCode}
      />
    </>
  )
}

export default IndexPage
