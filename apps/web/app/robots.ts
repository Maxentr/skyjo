import { routing } from "@/i18n/routing"
import { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""
  const disallow = routing.locales.map((locale) =>
    locale === routing.defaultLocale ? `/game/` : `/${locale}/game/`,
  )

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: disallow,
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
