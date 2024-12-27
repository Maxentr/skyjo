import { routing } from "@/i18n/routing"
import { MetadataRoute } from "next"

type Page = {
  name: string
  priority: number
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""
  const pages: Page[] = [
    {
      name: "",
      priority: 1,
    },
    {
      name: "search",
      priority: 0.9,
    },
    {
      name: "create?private=true",
      priority: 0.9,
    },
    {
      name: "create?private=false",
      priority: 0.9,
    },
    {
      name: "rules",
      priority: 0.8,
    },
    {
      name: "privacy-policy",
      priority: 0.7,
    },
  ]

  const sitemap = pages.map((page) => {
    return routing.locales.map((locale) => {
      let url: string = ""
      if (locale === routing.defaultLocale) {
        url = `${baseUrl}/${page.name}`
      } else if (page.name === "") {
        url = `${baseUrl}/${locale}`
      } else {
        url = `${baseUrl}/${locale}/${page.name}`
      }

      return {
        url,
        lastModified: new Date(),
        priority: page.priority,
      }
    })
  })

  return sitemap.flat()
}
