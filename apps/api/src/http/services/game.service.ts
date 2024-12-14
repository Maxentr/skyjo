import { GameRepository } from "@skyjo/cache"
import type { Skyjo, SkyjoPlayer } from "@skyjo/core"
import type { PublicGame, PublicGameTag } from "@skyjo/shared/types"

export class GameService {
  private readonly gameRepository = new GameRepository()

  async getPublicGames(nbPerPage: number, page: number): Promise<PublicGame[]> {
    const games = await this.gameRepository.getPublicGames(nbPerPage, page)

    return this.parsePublicGames(games)
  }

  //#region private methods
  private constructTagArray(game: Skyjo) {
    const tags: PublicGameTag[] = []

    if (game.settings.isClassicSettings()) tags.push("classic")
    if (game.settings.allowSkyjoForRow) tags.push("row")
    if (game.settings.allowSkyjoForColumn) tags.push("column")
    if (game.settings.scoreToEndGame > 100) tags.push("long-game")
    if (game.settings.scoreToEndGame < 100) tags.push("short-game")

    return tags
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
      tags: this.constructTagArray(game),
    }
  }

  private parsePublicGames(games: Skyjo[]): PublicGame[] {
    return games.map((game) => this.parsePublicGame(game))
  }
  //#endregion
}
