import z from "zod"

export const feedbackSchema = z.object({
  message: z.string().max(500),
  email: z.string().email().optional().or(z.literal("")),
})
export type Feedback = z.infer<typeof feedbackSchema>
