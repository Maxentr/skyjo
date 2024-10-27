import type { SkyjoCardToJson } from "@/types/skyjoCard.js"

interface SkyjoCardInterface {
  readonly id: string
  readonly value: number
  readonly isVisible: boolean

  turnVisible(): void
  toJson(): SkyjoCardToJson
}

export class SkyjoCard implements SkyjoCardInterface {
  id: string = crypto.randomUUID()
  value: number
  isVisible: boolean = false

  constructor(value: number, isVisible?: boolean, id?: string) {
    this.value = value
    if (isVisible) this.isVisible = isVisible
    if (id) this.id = id
  }

  turnVisible() {
    this.isVisible = true
  }

  toJson() {
    return {
      id: this.id,
      value: this.value,
      isVisible: this.isVisible,
    } satisfies SkyjoCardToJson
  }
}
