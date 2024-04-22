import { locales } from "@/i18n"
import { DEFAULT_LOCALE } from "@/navigation"
import { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.SITE_URL ?? ""
  const pages = ["", "rules"]

  const sitemap = pages.map((page) => {
    return locales.map((locale) => {
      const url =
        locale === DEFAULT_LOCALE
          ? `${baseUrl}/${page}`
          : `${baseUrl}/${locale}/${page}`

      return {
        url,
        lastModified: new Date(),
        priority: 1,
      }
    })
  })

  return sitemap.flat()
}
