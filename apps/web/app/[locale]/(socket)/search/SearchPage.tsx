"use client"

import { GamesList } from "@/app/[locale]/(socket)/search/GamesList"
import { SearchHeader } from "@/app/[locale]/(socket)/search/SearchHeader"
import { TagsFilter } from "@/app/[locale]/(socket)/search/TagsFilter"
import MenuDropdown from "@/components/MenuDropdown"
import { PublicGame, PublicGameTag } from "@skyjo/shared/types"
import { useQuery } from "@tanstack/react-query"
import { m } from "framer-motion"
import { useState } from "react"

const MAX_GAMES_PER_PAGE = 20
const fetchPublicGames = async (page = 1): Promise<PublicGame[]> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/games/public?nbPerPage=${MAX_GAMES_PER_PAGE}&page=${page}`,
  ).then((res) => res.json())

  if (response.error) {
    throw new Error(response.error)
  }

  return response.games
}

export const SearchPage = () => {
  const [buttonLoading, setButtonLoading] = useState(false)
  const [selectedTags, setSelectedTags] = useState<PublicGameTag[]>([])

  const page = 1
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["publicGames", page],
    queryFn: () => fetchPublicGames(page),
    refetchInterval: 30000,
    retryDelay: (attemptIndex) => {
      return Math.min(1000 * 2 ** attemptIndex, 30000)
    },
  })

  const onTagClick = (tag: PublicGameTag) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag)
      return [...prev, tag]
    })
  }

  const filteredGames =
    selectedTags.length > 0
      ? data?.filter((game) =>
          selectedTags.every((tag) => game.tags.includes(tag)),
        )
      : data

  return (
    <m.div
      className="relative min-h-svh w-full z-20 flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="w-full pt-4 px-4 flex justify-end lgh:md:absolute lgh:md:top-0 lgh:md:right-0">
        <MenuDropdown />
      </div>

      <div className="w-full max-w-xl flex flex-grow self-center flex-col justify-center py-8 p-4">
        <m.div
          className="bg-container dark:bg-dark-container border-2 border-black dark:border-dark-border rounded-2xl w-full flex flex-col gap-2 p-4 sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <SearchHeader
            onRefresh={refetch}
            isFetching={isFetching}
            buttonLoading={buttonLoading}
          />
          <TagsFilter selectedTags={selectedTags} onTagClick={onTagClick} />
          <GamesList
            games={filteredGames}
            isFetching={isFetching}
            buttonLoading={buttonLoading}
            setButtonLoading={setButtonLoading}
            onTagClick={onTagClick}
            onJoinGameError={refetch}
          />
        </m.div>
      </div>
    </m.div>
  )
}
