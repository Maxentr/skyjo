import { createRateLimiterMiddleware } from "@/http/middlewares/rateLimiter.js"
import { zValidator } from "@hono/zod-validator"
import { feedbackSchema } from "@skyjo/shared/validations"
import { Hono } from "hono"
import { RateLimiterMemory } from "rate-limiter-flexible"
import { FeedbackService } from "../services/feedback.service.js"

export const feedbackRouter = new Hono().basePath("/feedbacks")

const feedbackService = new FeedbackService()

const feedbackRateLimiter = new RateLimiterMemory({
  keyPrefix: "feedback",
  points: 1,
  duration: 15,
})

feedbackRouter.post(
  "/",
  createRateLimiterMiddleware(feedbackRateLimiter),
  zValidator("json", feedbackSchema),
  (c) => {
    const { email, message } = c.req.valid("json")

    const success = feedbackService.sendFeedback({ email, message })

    return c.json({ success })
  },
)
