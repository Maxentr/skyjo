import z from "zod"

export const sendChatMessage = z.object({
  username: z.string(),
  message: z.string().max(200),
})

export type SendChatMessage = z.infer<typeof sendChatMessage>

export const wizzPlayerUsername = z.string()

export type WizzPlayerUsername = z.infer<typeof wizzPlayerUsername>
