import { GameRepository } from "@skyjo/cache"
import type { Skyjo, SkyjoPlayer } from "@skyjo/core"
import type { PublicGame } from "@skyjo/shared/types"
import { BaseService } from "./base.service.js"

export class GameService extends BaseService {
  private gameRepository = new GameRepository()

  async getPublicGames(nbPerPage: number, page: number): Promise<PublicGame[]> {
    const games = await this.gameRepository.getPublicGames(nbPerPage, page)

    return this.parsePublicGames(games)
  }

  private parsePublicGamePlayers(
    players: SkyjoPlayer[],
  ): PublicGame["players"] {
    return players.map((p) => ({ id: p.id, avatar: p.avatar, name: p.name }))
  }

  private parsePublicGame(game: Skyjo): PublicGame {
    return {
      code: game.code,
      adminName: game.players.find((p) => game.isAdmin(p.id))?.name ?? "",
      players: this.parsePublicGamePlayers(game.players),
      maxPlayers: game.settings.maxPlayers,
    }
  }

  private parsePublicGames(games: Skyjo[]): PublicGame[] {
    return games.map((game) => this.parsePublicGame(game))
  }
}
