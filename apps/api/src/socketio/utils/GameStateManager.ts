import type { Skyjo, SkyjoToJson } from "@skyjo/core"
import {
  type SkyjoOperation,
  createStateOperations,
} from "@skyjo/state-operations"

export class GameStateManager {
  private previousState: SkyjoToJson

  private readonly game: Skyjo

  constructor(game: Skyjo) {
    this.previousState = structuredClone(game.toJson())
    this.game = game
  }

  getChanges(): SkyjoOperation | null {
    const currentState = this.game.toJson()
    const operations = createStateOperations(this.previousState, currentState)

    if (Object.keys(operations).length === 0) return null
    else this.game.stateVersion++

    this.previousState = structuredClone(currentState)

    return operations
  }
}
