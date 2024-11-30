import { Locales, routing } from "@/i18n/routing"
import deepmerge from "deepmerge"
import { getRequestConfig } from "next-intl/server"

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!locale || !routing.locales.includes(locale as Locales)) {
    locale = routing.defaultLocale
  }

  const localeMessages = (await import(`../locales/${locale}.json`)).default
  const defaultMessages = (await import(`../locales/en.json`)).default
  const messages = deepmerge(defaultMessages, localeMessages)

  return { locale, messages }
})
