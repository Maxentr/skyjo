import FeedbackLink from "@/components/FeedbackLink"
import { Link } from "@/navigation"
import { useTranslations } from "next-intl"
import Image from "next/image"

const Footer = () => {
  const t = useTranslations("components.Footer")

  return (
    <footer className="w-full border-t-2 border-black bg-off-white">
      <div className="container grid grid-cols-3 grid-flow-row py-8">
        <div className="flex flex-col justify-center items-start gap-2">
          <FeedbackLink text={t("feedback")} />
          <Link
            href="/#explanation"
            className="text-slate-900 underline"
            data-testid="footer-explanation-link"
          >
            {t("explanation")}
          </Link>
          <Link
            href="/rules"
            className="text-slate-900 underline"
            data-testid="footer-rules-link"
          >
            {t("rules")}
          </Link>
        </div>
        <div className="flex flex-col justify-center items-center gap-2">
          <Link
            href="/"
            className="text-slate-900 underline"
            data-testid="footer-home-link"
          >
            {t("home")}
          </Link>
          <Link
            href="https://github.com/Maxentr/Skyjo/releases"
            target="_blank"
            className="text-slate-900 underline"
            data-testid="footer-release-notes-link"
          >
            {t("release-notes")}
          </Link>
        </div>
        <div className="flex flex-col justify-center items-end gap-4">
          <Link
            href="https://www.magilano.com/produkt/skyjo/?lang=en&v=1d2a83b3af1f"
            target="_blank"
            className="text-slate-900 underline"
            data-testid="footer-buy-game-link"
          >
            {t("buy-game")}
          </Link>
          <Link href="https://github.com/Maxentr" target="_blank">
            <Image
              src="/svg/github.svg"
              width={24}
              height={24}
              alt="github.com/Maxentr"
              data-testid="footer-github-link"
            />
          </Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer
