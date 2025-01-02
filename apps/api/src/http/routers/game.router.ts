import { createRateLimiterMiddleware } from "@/http/middlewares/rateLimiter.js"
import { zValidator } from "@hono/zod-validator"
import { getPublicGamesQuerySchema } from "@skyjo/shared/validations"
import { Hono } from "hono"
import { RateLimiterMemory } from "rate-limiter-flexible"
import { GameService } from "../services/game.service.js"

export const gameRouter = new Hono().basePath("/games")

const gameService = new GameService()

const publicGamesRateLimiter = new RateLimiterMemory({
  keyPrefix: "public-games",
  points: 5,
  duration: 8,
})

gameRouter.get(
  "/public",
  createRateLimiterMiddleware(publicGamesRateLimiter),
  zValidator("query", getPublicGamesQuerySchema),
  async (c) => {
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
