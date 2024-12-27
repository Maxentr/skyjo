import { createNavigation } from "next-intl/navigation"
import { defineRouting } from "next-intl/routing"
import { Languages } from "next/dist/lib/metadata/types/alternative-urls-types"

const locales = ["en", "es", "fr"] as const
export type Locales = (typeof locales)[number]

export const routing = defineRouting({
  locales,
  localePrefix: "as-needed",
  defaultLocale: "en",
  localeDetection: true,
})
export const generateAlternatesLanguages = (
  route?: string,
): Languages<string> => {
  const localesWithoutDefault = routing.locales.filter(
    (locale) => locale !== routing.defaultLocale,
  )

  const path = route ? `/${route}` : ""

  const alternates = localesWithoutDefault.reduce((acc, locale) => {
    return {
      ...acc,
      [locale]: `${locale}${path}`,
    }
  }, {})

  return {
    [routing.defaultLocale]: path || "/",
    ...alternates,
  }
}

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing)
