import Footer from "@/components/Footer"
import { generateAlternatesLanguages } from "@/i18n/routing"
import { getCurrentUrl } from "@/lib/utils"
import { Metadata } from "next"
import { getTranslations } from "next-intl/server"

type SearchLayoutParams = {
  locale: string
}
export type SearchLayoutProps = Readonly<{
  children: React.ReactNode
  params: Promise<SearchLayoutParams>
}>

export async function generateMetadata(props: SearchLayoutProps) {
  const { locale } = await props.params

  const t = await getTranslations({
    locale,
    namespace: "pages.Search.head",
  })

  const currentUrl = getCurrentUrl("search", locale)

  const metadata: Metadata = {
    title: t("title"),
    description: t("description"),
    keywords: t("keywords").split(","),
    alternates: {
      canonical: currentUrl,
      languages: generateAlternatesLanguages("search"),
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: currentUrl,
    },
    twitter: {
      title: t("title"),
      description: t("description"),
    },
  }

  return metadata
}

export default async function SearchLayout({ children }: SearchLayoutProps) {
  return (
    <>
      {children}
      <Footer />
    </>
  )
}
