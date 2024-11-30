import Footer from "@/components/Footer"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/routing"
import { useTranslations } from "next-intl"
import Image from "next/image"

const NotFoundServerPage = () => {
  const t = useTranslations("pages.NotFound")

  return (
    <>
      <div className="flex flex-col items-center justify-center h-[90dvh] gap-2">
        <Image
          src="/svg/logo.svg"
          width={0}
          height={0}
          style={{ width: "auto", height: "2rem" }}
          className="select-none absolute top-4 inset-x-0 mx-auto sm:mx-0 sm:left-4"
          priority
          loading="eager"
          title="Skyjo"
          alt="Skyjo"
        />

        <h1 className="text-4xl font-bold text-center">{t("title")}</h1>
        <p className="text-lg text-center">{t("description")}</p>

        <Link href="/" className="mt-4" replace>
          <Button>{t("go-back-to-homepage")}</Button>
        </Link>
      </div>
      <Footer />
    </>
  )
}

export default NotFoundServerPage
