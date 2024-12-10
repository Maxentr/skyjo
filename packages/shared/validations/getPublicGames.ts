import { z } from "zod"

export const getPublicGamesQuerySchema = z.object({
  nbPerPage: z.coerce.number().int().min(1).default(20),
  page: z.coerce.number().int().min(1).default(1),
})
export type GetPublicGamesQuery = z.infer<typeof getPublicGamesQuerySchema>
