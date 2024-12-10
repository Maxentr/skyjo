"use client"

import { CreateGameButton } from "@/components/CreateGameButton"
import { JoinGameButton } from "@/components/JoinGameButton"
import MenuDropdown from "@/components/MenuDropdown"
import { Button } from "@/components/ui/button"
import { useRouter } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import { PublicGame } from "@skyjo/shared/types"
import { useSuspenseQuery } from "@tanstack/react-query"
import { m } from "framer-motion"
import { HomeIcon, RefreshCwIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { Suspense, useState } from "react"

export const SearchPage = () => {
  const router = useRouter()
  const t = useTranslations("pages.Search")
  const tAvatar = useTranslations("utils.avatar")

  const fetchPublicGames = async (page = 1): Promise<PublicGame[]> => {
    return fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/games/public?page=${page}`,
    ).then(async (res) => {
      const response = await res.json()
      if (response.error) {
        throw new Error(response.error)
      }

      return response.games
    })
  }

  const [page, setPage] = useState(1)
  const [buttonLoading, setButtonLoading] = useState(false)

  const { data, isLoading, refetch } = useSuspenseQuery({
    queryKey: ["publicGames", page],
    queryFn: () => fetchPublicGames(page),
  })

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

      <div className="w-full max-w-2xl">
        <div className="bg-container dark:bg-dark-container border-2 border-black dark:border-dark-border rounded-2xl w-full p-4 flex flex-col gap-4">
          <div className="flex flex-row items-center justify-between">
            <HomeIcon
              className="size-6 text-black dark:text-dark-font cursor-pointer"
              onClick={() => router.replace("/")}
            />
            <h2 className="text-black dark:text-dark-font text-center text-2xl">
              {t("title")}
            </h2>
            <m.button
              onClick={() => refetch()}
              className={cn(isLoading && "animate-spin")}
            >
              <RefreshCwIcon className="size-6 text-black dark:text-dark-font cursor-pointer" />
            </m.button>
          </div>

          <Suspense fallback={<div>Loading...</div>}>
            <div className="flex flex-col gap-2 items-center">
              {data.length === 0 && <div>No games found</div>}
              {data?.map((game) => (
                <div
                  key={game.code}
                  className="w-full px-8 md:px-12 py-8 flex flex-row items-center justify-between"
                >
                  <div className="flex flex-col">
                    <p className="text-black dark:text-dark-font text-lg">
                      Partie {game.code}
                    </p>
                    <div className="flex flex-row items-center gap-1">
                      {game.players.map((player) => (
                        <div
                          key={player.avatar + player.name}
                          className="flex flex-col gap-1 items-center justify-center"
                        >
                          <Image
                            src={`/avatars/${player.avatar}.svg`}
                            width={20}
                            height={20}
                            alt={tAvatar(player.avatar)}
                            priority
                          />
                          <p className="text-black dark:text-dark-font text-xs">
                            {player.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <JoinGameButton
                    gameCode={game.code}
                    loading={buttonLoading}
                    setLoading={setButtonLoading}
                    className="w-fit"
                  />
                </div>
              ))}
            </div>
          </Suspense>
          <CreateGameButton
            type="public"
            className="w-fit mx-auto"
            loading={buttonLoading}
            setLoading={setButtonLoading}
          />
          <div className="flex flex-row items-center gap-2 justify-center">
            <Button onClick={() => setPage(page - 1)}>Previous</Button>
            <p className="text-black dark:text-dark-font text-sm">
              Page {page}
            </p>
            <Button onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      </div>
    </m.div>
  )
}
