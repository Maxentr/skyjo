"use client"

import { CreateGameButton } from "@/components/CreateGameButton"
import { JoinGameButton } from "@/components/JoinGameButton"
import MenuDropdown from "@/components/MenuDropdown"
import { useRouter } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import { PublicGame } from "@skyjo/shared/types"
import { useQuery } from "@tanstack/react-query"
import { m } from "framer-motion"
import { Gamepad2Icon, HomeIcon, RefreshCwIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { Dispatch, Fragment, SetStateAction, useState } from "react"

const fetchPublicGames = async (page = 1): Promise<PublicGame[]> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/games/public?nbPerPage=20&page=${page}`,
  ).then((res) => res.json())

  if (response.error) {
    throw new Error(response.error)
  }

  return response.games
}

export const SearchPage = () => {
  const router = useRouter()
  const t = useTranslations("pages.Search")

  const [buttonLoading, setButtonLoading] = useState(false)

  const page = 1
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["publicGames", page],
    queryFn: () => fetchPublicGames(page),
    refetchInterval: 30000,
  })

  return (
    <m.div
      className="relative h-svh w-full z-20 flex flex-col items-center mdh:justify-center overflow-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="w-full pt-4 px-4 flex justify-end lgh:md:absolute lgh:md:top-0 lgh:md:right-0">
        <MenuDropdown />
      </div>

      <div className="w-full max-w-xl h-full flex flex-col justify-center p-4 sm:p-0">
        <m.div
          className="bg-container dark:bg-dark-container border-2 border-black dark:border-dark-border rounded-2xl w-full flex flex-col gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex flex-row items-center justify-between pt-4 px-4 sm:pt-8 sm:px-8">
            <button
              className="size-6 text-black dark:text-dark-font cursor-pointer"
              onClick={() => router.replace("/")}
              title={t("back")}
            >
              <HomeIcon className="size-6" />
            </button>
            <h2 className="text-black dark:text-dark-font text-center text-2xl">
              {t("title")}
            </h2>

            <button
              className="size-6 text-black dark:text-dark-font disabled:opacity-50 cursor-pointer"
              onClick={() => refetch()}
              disabled={isFetching}
              title={t("back")}
            >
              <RefreshCwIcon
                className={cn("size-6", isFetching && "animate-spin")}
              />
            </button>
          </div>

          <div className="flex flex-col gap-4 items-center overflow-y-scroll max-h-[55svh] px-4 sm:px-8 py-4">
            {isFetching ? (
              <LoadingPublicGames />
            ) : data?.length === 0 ? (
              <p className="min-h-[7svh] flex flex-1 flex-col items-center justify-center">
                {t("no-games-found")}
              </p>
            ) : (
              data?.map((game) => (
                <Fragment key={game.code}>
                  <PublicGameRow
                    game={game}
                    loading={buttonLoading}
                    setLoading={setButtonLoading}
                  />
                  <hr className="last:hidden w-full border-black dark:border-gray-700" />
                </Fragment>
              ))
            )}
          </div>
          <CreateGameButton
            type="public"
            className="w-fit mx-auto mb-4 sm:mb-8"
            loading={buttonLoading}
            setLoading={setButtonLoading}
          />
          {/* <div className="flex flex-row items-center gap-2 justify-center">
            <Button onClick={() => setPage(page - 1)}>Previous</Button>
            <p className="text-black dark:text-dark-font text-sm">
              Page {page}
            </p>
            <Button onClick={() => setPage(page + 1)}>Next</Button>
          </div> */}
        </m.div>
      </div>
    </m.div>
  )
}
type PublicGameRowProps = {
  game: PublicGame
  loading: boolean
  setLoading: Dispatch<SetStateAction<boolean>>
}
const PublicGameRow = ({ game, loading, setLoading }: PublicGameRowProps) => {
  const t = useTranslations("pages.Search")
  const tAvatar = useTranslations("utils.avatar")

  return (
    <div className="w-full flex flex-row items-center justify-between gap-4 sm:gap-0">
      <div className="flex flex-col gap-1">
        <p className="text-black dark:text-dark-font text-base">
          {t("game-of", { name: game.adminName })}
        </p>
        <div className="flex flex-row items-center gap-2">
          {game.players.map((player) => (
            <div
              key={player.id}
              className="flex flex-col items-center justify-center"
            >
              <Image
                src={`/avatars/${player.avatar}.svg`}
                width={20}
                height={20}
                alt={tAvatar(player.avatar)}
                title={player.name}
                priority
              />
            </div>
          ))}
          {Array.from({ length: game.maxPlayers - game.players.length }).map(
            (_, index) => (
              <div
                key={game.code + index}
                className="size-5 bg-gray-100 rounded-full"
              />
            ),
          )}
        </div>
      </div>
      <JoinGameButton
        gameCode={game.code}
        loading={loading}
        setLoading={setLoading}
        className="size-10 p-0"
      >
        <Gamepad2Icon className="size-5 text-black dark:text-dark-font" />
      </JoinGameButton>
    </div>
  )
}

const LoadingPublicGames = () => {
  return Array.from({ length: 2 }).map((_, index) => (
    <Fragment key={`loading-game-${index}`}>
      <div className="w-full flex flex-row items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="h-4 py-2 w-32 animate-pulse bg-gray-200 rounded" />
          <div className="flex flex-row items-center gap-2">
            {Array.from({ length: 8 }).map((_, playerIndex) => (
              <div
                key={`loading-player-${index}-${playerIndex}`}
                className="flex flex-col items-center justify-center"
              >
                <div className="size-5 animate-pulse bg-gray-200 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="size-10 animate-pulse bg-gray-200 rounded-md" />
      </div>
      <hr className="last:hidden w-full border-gray-200 animate-pulse" />
    </Fragment>
  ))
}
