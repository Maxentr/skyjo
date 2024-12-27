import { generateAlternatesLanguages } from "@/i18n/routing"
import { getCurrentUrl } from "@/lib/utils"
import { Metadata } from "next"
import { getTranslations } from "next-intl/server"

type CreateLayoutParams = {
  locale: string
}
export type CreateLayoutProps = Readonly<{
  children: React.ReactNode
  params: Promise<CreateLayoutParams>
}>

export async function generateMetadata(props: CreateLayoutProps) {
  const { locale } = await props.params

  const t = await getTranslations({
    locale,
    namespace: "pages.Create.head",
  })

  const currentUrl = getCurrentUrl("create", locale)

  const metadata: Metadata = {
    title: t("title"),
    description: t("description"),
    keywords: t("keywords").split(","),
    alternates: {
      canonical: currentUrl,
      languages: generateAlternatesLanguages("create"),
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

export default async function CreateLayout({ children }: CreateLayoutProps) {
  return children
}
