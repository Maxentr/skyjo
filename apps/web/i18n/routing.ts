import { createNavigation } from "next-intl/navigation"
import { defineRouting } from "next-intl/routing"

const locales = ["en", "es", "fr"] as const
export type Locales = (typeof locales)[number]

export const routing = defineRouting({
  locales,
  localePrefix: "as-needed",
  defaultLocale: "en",
  localeDetection: true,
})

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing)
