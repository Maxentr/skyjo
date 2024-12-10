import { zValidator } from "@hono/zod-validator"
import { getPublicGamesQuerySchema } from "@skyjo/shared/validations"
import { Hono } from "hono"
import { GameService } from "../services/game.service.js"

export const gameRouter = new Hono().basePath("/games")

const gameService = new GameService()

gameRouter.get(
  "/public",
  zValidator("query", getPublicGamesQuerySchema),
  async (c) => {
    console.log("get public games")
    const query = c.req.valid("query")

    const games = await gameService.getPublicGames(query.nbPerPage, query.page)

    return c.json({
      success: true,
      games,
      page: query.page,
      length: query.nbPerPage,
    })
  },
)
