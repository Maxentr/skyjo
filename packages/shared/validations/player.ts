import { z } from "zod"
import { AVATARS, type Avatar } from "../constants.js"

const avatar: z.ZodType<Avatar> = z.enum(
  Object.values<Avatar>(AVATARS) as [Avatar],
)

export const createPlayer = z.object({
  username: z
    .string()
    .min(1)
    .transform((val) => val.slice(0, 20).replace(/ /g, "_")),
  avatar: avatar,
})

export type CreatePlayer = z.infer<typeof createPlayer>
