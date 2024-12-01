import Footer from "@/components/Footer"
import { getCurrentUrl } from "@/lib/utils"
import { Metadata } from "next"
import { getTranslations } from "next-intl/server"

type RulesLayoutParams = {
  locale: string
}
export type RulesLayoutProps = Readonly<{
  children: React.ReactNode
  params: Promise<RulesLayoutParams>
}>

export async function generateMetadata(props: RulesLayoutProps) {
  const { locale } = await props.params

  const t = await getTranslations({ locale, namespace: "pages.Rules.head" })

  const currentUrl = getCurrentUrl("rules", locale)

  const metadata: Metadata = {
    title: t("title"),
    description: t("description"),
    keywords: t("keywords").split(","),
    alternates: {
      canonical: currentUrl,
      languages: {
        en: "/rules",
        fr: "/fr/rules",
        es: "/es/rules",
      },
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

export default async function RulesLayout({ children }: RulesLayoutProps) {
  return (
    <>
      {children}
      <Footer />
    </>
  )
}
