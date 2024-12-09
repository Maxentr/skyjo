"use client"

import GameLobbyButtons from "@/components/GameLobbyButtons"
import SelectAvatar from "@/components/SelectAvatar"
import { Input } from "@/components/ui/input"
import { useUser } from "@/contexts/UserContext"
import { useTranslations } from "next-intl"
import { ChangeEvent } from "react"

type Props = {
  searchParams: {
    gameCode?: string
  }
}

const IndexPage = ({ searchParams }: Props) => {
  const t = useTranslations("pages.Index")
  const { username, setUsername } = useUser()

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
      <GameLobbyButtons gameCode={searchParams.gameCode} />
    </>
  )
}

export default IndexPage
