import FeedbackLink from "@/components/FeedbackLink"
import { Link } from "@/navigation"
import { useTranslations } from "next-intl"
import Image from "next/image"

const Footer = () => {
  const t = useTranslations("components.Footer")

  return (
    <footer className="w-full flex flex-col gap-8 border-t-2 border-black bg-container py-8">
      <div className="container grid grid-cols-1 md:grid-cols-3 grid-flow-row gap-8">
        <div className="flex flex-col justify-center items-center md:items-start gap-3 md:gap-4">
          <FeedbackLink text={t("feedback")} />
          <Link href="/#explanation" className="text-black underline">
            {t("explanation")}
          </Link>
          <Link href="/rules" className="text-black underline">
            {t("rules")}
          </Link>
        </div>
        <div className="flex flex-col justify-center items-center gap-3 md:gap-4">
          <Link href="/" className="text-black underline">
            {t("home")}
          </Link>
          <Link
            href="https://github.com/Maxentr/Skyjo/releases"
            target="_blank"
            className="text-black underline"
          >
            {t("release-notes")}
          </Link>
          <Link href="/privacy-policy" className="text-black underline">
            {t("privacy-policy")}
          </Link>
        </div>
        <div className="flex flex-col justify-center items-center md:items-end gap-3 md:gap-4">
          <Link
            href="https://www.magilano.com/produkt/skyjo/?lang=en&v=1d2a83b3af1f"
            target="_blank"
            className="text-black underline"
          >
            {t("buy-game")}
          </Link>
          <Link href="https://github.com/Maxentr" target="_blank">
            <Image
              src="/svg/github.svg"
              width={24}
              height={24}
              alt="github.com/Maxentr"
            />
          </Link>
        </div>
      </div>
      <div className="container flex flex-col gap-2">
        <p className="text-center text-black text-sm">{t("disclaimer")}</p>
      </div>
    </footer>
  )
}

export default Footer
