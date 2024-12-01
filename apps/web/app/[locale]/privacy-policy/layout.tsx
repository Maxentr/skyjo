import Footer from "@/components/Footer"
import { getCurrentUrl } from "@/lib/utils"
import { Metadata } from "next"
import { getTranslations } from "next-intl/server"

type PrivacyPolicyLayoutParams = {
  locale: string
}
export type PrivacyPolicyLayoutProps = Readonly<{
  children: React.ReactNode
  params: Promise<PrivacyPolicyLayoutParams>
}>

export async function generateMetadata(props: PrivacyPolicyLayoutProps) {
  const { locale } = await props.params

  const t = await getTranslations({
    locale,
    namespace: "pages.PrivacyPolicy.head",
  })

  const currentUrl = getCurrentUrl("privacy-policy", locale)

  const metadata: Metadata = {
    title: t("title"),
    description: t("description"),
    keywords: t("keywords").split(","),
    alternates: {
      canonical: currentUrl,
      languages: {
        en: "/privacy-policy",
        fr: "/fr/privacy-policy",
        es: "/es/privacy-policy",
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

export default async function PrivacyPolicyLayout({
  children,
}: PrivacyPolicyLayoutProps) {
  return (
    <>
      {children}
      <Footer />
    </>
  )
}
