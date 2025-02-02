import { JoinGameButton } from "@/components/JoinGameButton"
import { PublicGame, type PublicGameTag } from "@skyjo/shared/types"
import { AnimatePresence, m } from "framer-motion"
import { Gamepad2Icon } from "lucide-react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { Dispatch, Fragment, SetStateAction } from "react"
import { GameTag } from "./GameTag"

type GamesListProps = {
  games: PublicGame[] | undefined
  isFetching: boolean
  buttonLoading: boolean
  setButtonLoading: Dispatch<SetStateAction<boolean>>
  onTagClick: (tag: PublicGameTag) => void
  onJoinGameError: () => void
}

export const GamesList = ({
  games,
  isFetching,
  buttonLoading,
  setButtonLoading,
  onTagClick,
  onJoinGameError,
}: GamesListProps) => {
  const t = useTranslations("pages.Search")

  const isEmpty = games?.length === 0 && !isFetching

  return (
    <div className="flex flex-col gap-4 items-center py-4">
      <AnimatePresence>
        {isFetching && <LoadingPublicGames />}
        {isEmpty ? (
          <m.p
            className="min-h-[6svh] flex flex-1 flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.2 } }}
            exit={{ opacity: 0, transition: { duration: 0 } }}
          >
            {t("no-games-found")}
          </m.p>
        ) : (
          games?.map((game) => (
            <Fragment key={game.code}>
              <PublicGameRow
                game={game}
                loading={buttonLoading}
                setLoading={setButtonLoading}
                onTagClick={onTagClick}
                onJoinGameError={onJoinGameError}
              />
              <m.hr
                className="last:hidden w-full border-black dark:border-gray-700"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.2 } }}
                exit={{ opacity: 0, transition: { duration: 0 } }}
              />
            </Fragment>
          ))
        )}
      </AnimatePresence>
    </div>
  )
}

type PublicGameRowProps = {
  game: PublicGame
  loading: boolean
  setLoading: Dispatch<SetStateAction<boolean>>
  onTagClick: (tag: PublicGameTag) => void
  onJoinGameError: () => void
}
const PublicGameRow = ({
  game,
  loading,
  setLoading,
  onTagClick,
  onJoinGameError,
}: PublicGameRowProps) => {
  const t = useTranslations("pages.Search")
  const tAvatar = useTranslations("utils.avatar")

  return (
    <m.div
      className="w-full flex flex-row items-center justify-between gap-4 sm:gap-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.2 } }}
      exit={{ opacity: 0, display: "none", transition: { duration: 0.2 } }}
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-2">
          <p className="text-black dark:text-dark-font text-base">
            {t("game-of", { name: game.adminName })}
          </p>
          <div className="flex flex-row items-center gap-1">
            {game.tags.map((tag) => (
              <GameTag key={tag} tag={tag} onClick={onTagClick} />
            ))}
          </div>
        </div>
        <div className="flex flex-row items-center gap-1 sm:gap-2">
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
                className="select-none dark:opacity-75"
                title={player.name}
                priority
              />
            </div>
          ))}
          {Array.from({ length: game.maxPlayers - game.players.length }).map(
            (_, index) => (
              <div
                key={game.code + index}
                className="size-5 bg-gray-100 dark:bg-gray-700 rounded-full"
              />
            ),
          )}
        </div>
      </div>
      <JoinGameButton
        gameCode={game.code}
        loading={loading}
        setLoading={setLoading}
        onError={onJoinGameError}
        className="size-10 p-0"
      >
        <Gamepad2Icon className="size-5 text-black dark:text-dark-font" />
      </JoinGameButton>
    </m.div>
  )
}

const LoadingPublicGames = () => {
  return Array.from({ length: 2 }).map((_, index) => (
    <Fragment key={`loading-game-${index}`}>
      <m.div
        className="w-full flex flex-row items-center justify-between"
        initial={{ display: "none" }}
        animate={{ display: "flex", transition: { delay: 0.21 } }}
        exit={{ display: "none", transition: { duration: 0 } }}
      >
        <div className="flex flex-col gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-2">
            <div className="h-4 py-2 w-32 animate-pulse bg-gray-200 dark:bg-gray-600 rounded" />
            <div className="flex flex-row items-center gap-1">
              {Array.from({ length: 3 }).map((_, tagIndex) => (
                <div
                  key={`loading-tag-${index}-${tagIndex}`}
                  className="flex flex-row items-center rounded-full px-2.5 py-0.5 animate-pulse bg-gray-200 dark:bg-gray-600"
                >
                  <div className="h-4 w-6" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-row items-center gap-2">
            {Array.from({ length: 8 }).map((_, playerIndex) => (
              <div
                key={`loading-player-${index}-${playerIndex}`}
                className="flex flex-col items-center justify-center"
              >
                <div className="size-5 animate-pulse bg-gray-200 dark:bg-gray-600 rounded-full" />
              </div>
            ))}
          </div>
        </div>
        <div className="size-10 animate-pulse bg-gray-200 dark:bg-gray-600 rounded-md" />
      </m.div>
      <m.hr
        className="last:hidden w-full border-gray-200 dark:border-gray-600 animate-pulse"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 0.3 } }}
        exit={{ opacity: 0, transition: { duration: 0 } }}
      />
    </Fragment>
  ))
}
