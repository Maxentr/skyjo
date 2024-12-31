import { useRouter } from "@/i18n/routing"
import { cn } from "@/lib/utils"
import { HomeIcon, PlusIcon, RefreshCwIcon } from "lucide-react"
import { useTranslations } from "next-intl"

type SearchHeaderProps = {
  onRefresh: () => void
  isFetching: boolean
  buttonLoading: boolean
}

export const SearchHeader = ({
  onRefresh,
  isFetching,
  buttonLoading,
}: SearchHeaderProps) => {
  const router = useRouter()
  const t = useTranslations("pages.Search.header")

  return (
    <header className="flex flex-row items-center justify-between">
      <div className="flex flex-row gap-4">
        <button
          className="size-6 text-black dark:text-dark-font cursor-pointer"
          onClick={() => router.replace("/")}
          title={t("back")}
        >
          <HomeIcon className="size-6" />
        </button>
        <span className="size-6" />
      </div>
      <h2 className="text-black dark:text-dark-font text-center text-2xl">
        {t("title")}
      </h2>
      <div className="flex flex-row gap-4">
        <button
          className="size-6 text-black dark:text-dark-font disabled:opacity-50 cursor-pointer"
          onClick={onRefresh}
          disabled={isFetching}
          title={t("refresh")}
        >
          <RefreshCwIcon
            className={cn("size-6", isFetching && "animate-spin")}
          />
        </button>
        <button
          className="size-6 text-black dark:text-dark-font disabled:opacity-50 cursor-pointer"
          onClick={() => router.push("/create?private=false")}
          title={t("create-button.title")}
          disabled={buttonLoading}
        >
          <PlusIcon className="size-6" />
        </button>
      </div>
    </header>
  )
}
