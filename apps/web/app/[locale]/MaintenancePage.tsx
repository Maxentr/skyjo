import { Link } from "@/i18n/routing"
import { useTranslations } from "next-intl"
import Image from "next/image"

const MaintenancePage = () => {
  const t = useTranslations("pages.Maintenance")

  return (
    <div className="flex flex-col items-center justify-center h-dvh gap-2 p-4">
      <Image
        src="/svg/logo.svg"
        width={0}
        height={0}
        style={{ width: "auto", height: "2rem" }}
        className="select-none absolute top-4 inset-x-0 mx-auto sm:mx-0 sm:left-4 dark:invert"
        priority
        loading="eager"
        title="Skyjo"
        alt="Skyjo"
      />
      <h1 className="text-black dark:text-white text-4xl font-bold text-center">
        {t("title")}
      </h1>
      <p className="text-black dark:text-white text-center">
        {t("description")}
      </p>
      <Link
        href="https://github.com/maxentr/skyjo"
        className="absolute bottom-4 inset-x-0 flex justify-center"
      >
        <Image
          src="/svg/github.svg"
          width={24}
          height={24}
          alt={t("github-alt")}
          className="dark:invert"
        />
      </Link>
    </div>
  )
}

export default MaintenancePage
