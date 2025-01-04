"use client"

import DiscardPile from "@/components/DiscardPile"
import DrawPile from "@/components/DrawPile"
import EndRoundDialog from "@/components/EndRoundDialog"
import GameInfo from "@/components/GameInfo"
import { GameRules } from "@/components/GameRules"
import GameStoppedDialog from "@/components/GameStoppedDialog"
import MenuDropdown from "@/components/MenuDropdown"
import OpponentBoard from "@/components/OpponentBoard"
import OpponentsMobileView from "@/components/OpponentsMobileView"
import PlayerBoard from "@/components/PlayerBoard"
import Scoreboard from "@/components/Scoreboard"
import { useRules } from "@/contexts/RulesContext"
import { useSkyjo } from "@/contexts/SkyjoContext"
import { useRouter } from "@/i18n/routing"
import { isCurrentUserTurn } from "@/lib/skyjo"
import { getRedirectionUrl } from "@/lib/utils"
import { Constants as CoreConstants } from "@skyjo/core"
import { useEffect } from "react"
import { useLocalStorage } from "react-use"

const GamePage = () => {
  const { game, player, opponents } = useSkyjo()
  const { openRules, isRulesOpen } = useRules()
  const router = useRouter()
  const [firstGame, setFirstGame] = useLocalStorage<boolean>("firstGame")

  const isPlayerTurn = isCurrentUserTurn(game, player)
  const roundInProgress =
    game.roundStatus === CoreConstants.ROUND_STATUS.MAIN ||
    game.roundStatus === CoreConstants.ROUND_STATUS.LAST_LAP

  const isFirstPlayerGame = firstGame ?? true

  useEffect(() => {
    if (isFirstPlayerGame) openRules()
  }, [isFirstPlayerGame])

  useEffect(() => {
    if (!isRulesOpen && isFirstPlayerGame) setFirstGame(false)
  }, [isRulesOpen])

  useEffect(() => {
    if (game.status === CoreConstants.GAME_STATUS.STOPPED) return

    setTimeout(() => {
      router.replace(getRedirectionUrl(game.code, game.status))
    }, 2000)
  }, [game.status])

  return (
    <div className="h-full w-full !p-4 !md:p-6 bg-body dark:bg-dark-body flex flex-col gap-2">
      <div className="w-full flex flex-row items-start h-full">
        {/* mobile */}
        <OpponentsMobileView />
        {/* desktop */}
        <div className="hidden lg:block w-10"></div>
        <div className="hidden lg:flex flex-1 flex-row justify-evenly w-full h-full">
          {opponents[1].map((opponent) => (
            <OpponentBoard
              opponent={opponent}
              key={opponent.id}
              isPlayerTurn={isCurrentUserTurn(game, opponent)}
            />
          ))}
        </div>
        <div className="flex flex-row justify-end">
          <div className="flex flex-col gap-4 items-center justify-start">
            <MenuDropdown />
            <Scoreboard />
            <GameRules />
          </div>
        </div>
      </div>
      <div className="w-full h-full grid grid-cols-3 grid-flow-row">
        <div className="hidden lg:flex flex-col items-start">
          {opponents[0].map((opponent) => (
            <OpponentBoard
              opponent={opponent}
              key={opponent.id}
              isPlayerTurn={isCurrentUserTurn(game, opponent)}
            />
          ))}
        </div>
        <div className="col-start-2 relative flex flex-col justify-center items-center gap-4">
          <div className="relative flex flex-row items-center justify-center gap-10 h-full max-h-20 w-fit">
            <GameInfo />
            <DrawPile isPlayerTurn={isPlayerTurn && roundInProgress} />
            <DiscardPile isPlayerTurn={isPlayerTurn && roundInProgress} />
          </div>
        </div>
        <div className="hidden lg:flex flex-col items-end">
          {opponents[2].map((opponent) => (
            <OpponentBoard
              opponent={opponent}
              key={opponent.id}
              isPlayerTurn={isCurrentUserTurn(game, opponent)}
            />
          ))}
        </div>
      </div>
      <div className="w-full h-full grid grid-cols-3 grid-flow-row items-end">
        {player && <PlayerBoard player={player} isPlayerTurn={isPlayerTurn} />}
      </div>
      <EndRoundDialog />
      <GameStoppedDialog />
    </div>
  )
}

export default GamePage
