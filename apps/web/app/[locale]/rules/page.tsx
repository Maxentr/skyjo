import Rules from "@/components/Rules"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"
import Image from "next/image"
import Link from "next/link"

const RulesPage = () => {
  const t = useTranslations("pages.Rules")
  return (
    <div className="container bg-body dark:bg-dark-body my-40 text-black dark:text-dark-font">
      <Link href="/" className="flex justify-center my-6">
        <Image
          src="/svg/logo.svg"
          width={0}
          height={0}
          style={{ width: "auto", height: "2.5rem" }}
          className="select-none dark:invert cursor-pointer"
          priority
          loading="eager"
          title="Skyjo"
          alt="Skyjo"
        />
      </Link>
      <h1 className="text-3xl mt-6 mb-4">{t("title")}</h1>
      <Rules />
      <div className="flex flex-col items-center">
        <Button className="mt-8">
          <Link href="/">Jouer en ligne gratuitement !</Link>
        </Button>
      </div>
    </div>
  )
}

export default RulesPage
