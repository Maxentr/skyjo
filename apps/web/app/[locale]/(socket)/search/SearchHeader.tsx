import { useRouter } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import { HomeIcon, RefreshCwIcon } from "lucide-react"
import { useTranslations } from "next-intl"

type SearchHeaderProps = {
  onRefresh: () => void
  isFetching: boolean
}

export const SearchHeader = ({ onRefresh, isFetching }: SearchHeaderProps) => {
  const router = useRouter()
  const t = useTranslations("pages.Search.header")

  return (
    <div className="flex flex-row items-center justify-between pt-8 px-8">
      <button
        className="size-6 text-black dark:text-dark-font cursor-pointer"
        onClick={() => router.replace("/")}
        title={t("back")}
      >
        <HomeIcon className="size-6" />
      </button>
      <h2 className="text-black dark:text-dark-font text-center text-2xl">
        {t("title")}
      </h2>
      <button
        className="size-6 text-black dark:text-dark-font disabled:opacity-50 cursor-pointer"
        onClick={onRefresh}
        disabled={isFetching}
        title={t("refresh")}
      >
        <RefreshCwIcon className={cn("size-6", isFetching && "animate-spin")} />
      </button>
    </div>
  )
}
