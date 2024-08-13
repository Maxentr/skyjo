"use client"

import Chat from "@/components/Chat"
import DiscardPile from "@/components/DiscardPile"
import DrawPile from "@/components/DrawPile"
import EndGameDialog from "@/components/EndGameDialog"
import EndRoundDialog from "@/components/EndRoundDialog"
import FeedbackButton from "@/components/FeedbackButton"
import GameInfo from "@/components/GameInfo"
import GameStoppedDialog from "@/components/GameStoppedDialog"
import OpponentBoard from "@/components/OpponentBoard"
import OpponentsMobileView from "@/components/OpponentsMobileView"
import PlayerBoard from "@/components/PlayerBoard"
import RulesDialog from "@/components/RulesDialog"
import Scoreboard from "@/components/Scoreboard"
import { useSkyjo } from "@/contexts/SkyjoContext"
import { isCurrentUserTurn } from "@/lib/skyjo"
import { useLocalStorage } from "react-use"
import { GAME_STATUS, ROUND_STATUS } from "shared/constants"

const GamePage = () => {
  const { game, player, opponents } = useSkyjo()
  const [firstGame, setFirstGame] = useLocalStorage<boolean>("firstGame")

  const isPlayerTurn = isCurrentUserTurn(game, player?.socketId)
  const roundInProgress =
    game.roundStatus === ROUND_STATUS.PLAYING ||
    game.roundStatus === ROUND_STATUS.LAST_LAP

  const isFirstPlayerGame = firstGame ?? true
  const onRulesDialogOpenChange = () => {
    if (isFirstPlayerGame) setFirstGame(false)
  }

  return (
    <div className="h-full w-full bg-body flex flex-col gap-6">
      <div className="w-full flex flex-row items-start h-full">
        {/* mobile */}
        <OpponentsMobileView />
        {/* desktop */}
        <div className="hidden md:block w-10"></div>
        <div className="hidden md:flex flex-1 flex-row justify-evenly w-full h-full">
          {opponents[1].map((opponent) => (
            <OpponentBoard
              opponent={opponent}
              key={opponent.socketId}
              isPlayerTurn={isCurrentUserTurn(game, opponent.socketId)}
            />
          ))}
        </div>
        <div className="flex flex-row justify-end">
          <div className="flex flex-col gap-4 items-center justify-start">
            <Scoreboard />
            <RulesDialog
              defaultOpen={isFirstPlayerGame}
              onOpenChange={onRulesDialogOpenChange}
            />
            <FeedbackButton className="mt-4" />
          </div>
        </div>
      </div>
      <div className="w-full h-full grid grid-cols-3 grid-flow-row">
        <div className="hidden md:flex flex-col items-start">
          {opponents[0].map((opponent) => (
            <OpponentBoard
              opponent={opponent}
              key={opponent.socketId}
              isPlayerTurn={isCurrentUserTurn(game, opponent.socketId)}
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
        <div className="hidden md:flex flex-col items-end">
          {opponents[2].map((opponent) => (
            <OpponentBoard
              opponent={opponent}
              key={opponent.socketId}
              isPlayerTurn={isCurrentUserTurn(game, opponent.socketId)}
            />
          ))}
        </div>
      </div>
      <div className="w-full h-full grid grid-cols-3 grid-flow-row items-end">
        {player && <PlayerBoard player={player} isPlayerTurn={isPlayerTurn} />}
      </div>
      <EndRoundDialog />
      <EndGameDialog />
      <GameStoppedDialog />
      <Chat disabled={game.status === GAME_STATUS.LOBBY} />
    </div>
  )
}

export default GamePage