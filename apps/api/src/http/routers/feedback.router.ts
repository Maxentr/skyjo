import { zValidator } from "@hono/zod-validator"
import { feedbackSchema } from "@skyjo/shared/validations"
import { Hono } from "hono"
import { FeedbackService } from "../services/feedback.service.js"

export const feedbackRouter = new Hono().basePath("/feedbacks")

const feedbackService = new FeedbackService()

feedbackRouter.post("/", zValidator("json", feedbackSchema), (c) => {
  const { email, message } = c.req.valid("json")

  const success = feedbackService.sendFeedback({ email, message })

  return c.json({ success })
})
