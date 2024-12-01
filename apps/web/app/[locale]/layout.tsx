import MaintenancePage from "@/app/[locale]/MaintenancePage"
import PostHogPageView from "@/app/[locale]/PostHogPageView"
import Providers from "@/app/[locale]/providers"
import { Locales, routing } from "@/i18n/routing"
import { posthogServer } from "@/lib/posthog-server"
import { getCurrentUrl } from "@/lib/utils"
import { Metadata, Viewport } from "next"
import { NextIntlClientProvider } from "next-intl"
import { getMessages, getTranslations } from "next-intl/server"
import { Fredoka } from "next/font/google"
import { notFound } from "next/navigation"

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: "variable",
  // display: "swap",
})

export type LocaleLayoutProps = Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>

export async function generateMetadata(props: LocaleLayoutProps) {
  const { locale } = await props.params

  const t = await getTranslations({ locale, namespace: "head" })

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? ""
  const currentUrl = getCurrentUrl("", locale)
  const githubUrl = new URL("https://github.com/Maxentr")

  const metadata: Metadata = {
    title: t("title"),
    description: t("description"),
    keywords: t("keywords").split(","),
    category: "game",
    applicationName: "Skyjo",
    appleWebApp: {
      capable: true,
      title: "Skyjo",
      statusBarStyle: "default",
    },
    icons: [
      { url: "/favicon.ico", rel: "shortcut icon" },
      {
        url: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/browserconfig.xml", rel: "msapplication-config" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      {
        url: "/mstile-150x150.png",
        sizes: "150x150",
        type: "image/png",
        rel: "msapplication-TileImage",
      },
      { url: "/safari-pinned-tab.svg", color: "#5bbad5", rel: "mask-icon" },
      { url: "/manifest.json", rel: "manifest" },
    ],
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: currentUrl,
      languages: {
        en: "/",
        fr: "/fr",
        es: "/es",
      },
    },
    authors: { url: githubUrl, name: "Maxent" },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: currentUrl,
      type: "website",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: t("title"),
        },
      ],
    },
    twitter: {
      title: t("title"),
      card: "summary_large_image",
      images: [
        {
          url: "/twitter-image.png",
          width: 1200,
          height: 675,
          alt: t("title"),
        },
      ],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      google: "Kipk8U-mhfetdtSI7Cy8V4QKE1Cc1Ws97QpZ3QfVNVk",
    },
  }

  return metadata
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fefdf7" },
    { media: "(prefers-color-scheme: dark)", color: "#242424" },
  ],
  minimumScale: 1,
  initialScale: 1,
  width: "device-width",
  height: "device-height",
  userScalable: false,
  viewportFit: "cover",
}

export default async function LocaleLayout(props: LocaleLayoutProps) {
  const params = await props.params

  const { locale } = params

  const { children } = props

  const messages = await getMessages()

  const isSiteUnderMaintenance = await posthogServer.isFeatureEnabled(
    "maintenance",
    "web-server",
  )

  if (!routing.locales.includes(locale as Locales)) {
    notFound()
  }

  return (
    <html lang={locale} suppressHydrationWarning style={fredoka.style}>
      <body className="bg-body dark:bg-dark-body antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {isSiteUnderMaintenance ? (
            <MaintenancePage />
          ) : (
            <Providers locale={locale as Locales}>
              <PostHogPageView />
              {children}
            </Providers>
          )}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
