import { RulesButton } from "@/app/[locale]/(socket)/RulesButton"
import Footer from "@/components/Footer"
import MenuDropdown from "@/components/MenuDropdown"
import MovingArrow from "@/components/MovingArrow"
import PWABanner from "@/components/PWABanner"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Link } from "@/i18n/routing"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { use } from "react"
import IndexPage from "./IndexPage"

type SearchParams = {
  gameCode?: string
}
type IndexServerPageProps = {
  searchParams: Promise<SearchParams>
}
const IndexServerPage = (props: IndexServerPageProps) => {
  const searchParams = use(props.searchParams)
  const t = useTranslations("pages.Index")

  const rulesLink = (chunks: React.ReactNode) => (
    <Link href="/rules" className="underline">
      {chunks}
    </Link>
  )

  return (
    <>
      <div className="bg-body dark:bg-dark-body flex flex-col">
        <div className="relative h-dvh !p-6 bg-body dark:bg-dark-body flex items-center justify-center">
          <PWABanner />
          <div className="absolute top-6 right-6 w-10 flex flex-col gap-4 z-10">
            <MenuDropdown />
          </div>
          <div className="bg-container dark:bg-dark-container border-2 border-black dark:border-dark-border px-10 md:px-16 py-6 mdh:md:py-12 rounded-xl md:w-3/6 max-w-2xl flex flex-col items-center">
            <h1 className="mb-5">
              <Image
                src="/svg/logo.svg"
                width={0}
                height={0}
                style={{ width: "auto", height: "2.5rem" }}
                className="select-none dark:invert"
                priority
                loading="eager"
                title="Skyjo"
                alt="Skyjo"
              />
            </h1>
            <IndexPage searchParams={searchParams} />
          </div>
          <div className="hidden mdh:sm:flex absolute bottom-6 left-6 right-6 z-10 items-center justify-center">
            <MovingArrow href="#explanation" />
          </div>
          {process.env.npm_package_version && (
            <Link
              href="https://github.com/maxentr/skyjo/releases/latest"
              target="_blank"
              className="absolute bottom-6 right-6 z-10 underline"
            >
              v{process.env.npm_package_version}
            </Link>
          )}
        </div>
        <section className="container bg-body dark:bg-dark-body my-8 max-w-4xl flex flex-col items-center">
          <h2
            id="explanation"
            className="text-center text-3xl text-black dark:text-dark-font pt-2 mb-4"
          >
            {t("explanation.title")}
          </h2>
          <p className="text-justify text-black dark:text-dark-font">
            {t("explanation.content")}
          </p>
          <RulesButton text={t("explanation.button")} />
        </section>

        <section className="container bg-body dark:bg-dark-body mt-16 mb-32 max-w-4xl flex flex-col items-center">
          <h2 className="text-center text-3xl text-black dark:text-dark-font mb-4">
            {t("faq.title")}
          </h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>{t("faq.meaning.title")}</AccordionTrigger>
              <AccordionContent>{t("faq.meaning.content")}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>{t("faq.pronounce.title")}</AccordionTrigger>
              <AccordionContent>{t("faq.pronounce.content")}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>{t("faq.how-to-play.title")}</AccordionTrigger>
              <AccordionContent>
                {t.rich("faq.how-to-play.content", {
                  rules: rulesLink,
                })}
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>{t("faq.how-to-win.title")}</AccordionTrigger>
              <AccordionContent>{t("faq.how-to-win.content")}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger className="text-start">
                {t("faq.play-classic-with-action.title")}
              </AccordionTrigger>
              <AccordionContent>
                {t("faq.play-classic-with-action.content")}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>
      </div>
      <Footer />
    </>
  )
}

export default IndexServerPage
