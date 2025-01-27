import { gameRouter } from "@/http/routers/game.router.js"
import { ENV } from "@env"
import type { Hono } from "hono"
import { cors } from "hono/cors"

export const initializeHttpServer = (app: Hono) => {
  app.use(
    "/*",
    cors({
      origin: ENV.ORIGINS,
    }),
  )

  app.get("/", (c) => {
    return c.text("API is running!")
  })

  // routes prefixe are defined in each router
  app.route("/", gameRouter)
}
