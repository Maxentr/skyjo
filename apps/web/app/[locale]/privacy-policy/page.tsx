import { Link } from "@/i18n/routing"
import dayjs from "dayjs"
import { useTranslations } from "next-intl"

const LAST_PAGE_UPDATED_DATE = dayjs("2025-01-27 18:56:00")

const RulesPage = () => {
  const t = useTranslations("pages.PrivacyPolicy.content")

  return (
    <div className="container bg-body dark:bg-dark-body my-16 text-black dark:text-dark-font">
      <Link href="/" className="underline">
        {t("back")}
      </Link>
      <h1 className="text-3xl mt-6 mb-4">{t("title")}</h1>
      <p className="text-justify">
        {t("last-update.text", {
          date: LAST_PAGE_UPDATED_DATE.format(t("last-update.date-format")),
        })}
      </p>
      <section className="mt-6">
        <h2 className="mt-2 text-2xl mb-0.5">
          {t("information-we-collect.title")}
        </h2>
        <RenderSubSection section="information-we-collect.anonymous-usage-data" />
        <RenderSubSection section="information-we-collect.game-data" />
        <RenderSubSection section="information-we-collect.local-storage-data" />
      </section>
      <RenderSection section="how-we-use-your-information" />
      <RenderSection section="data-storage-and-retention" />
      <RenderSection section="data-sharing" />
      <RenderSection section="your-rights-and-choices" />
      <RenderSection section="childrens-privacy" />
      <RenderSection section="changes-to-this-policy" />
      <RenderSection section="contact-us" />
    </div>
  )
}
type RenderSectionProps = {
  section: string
}
const RenderSection = ({ section }: RenderSectionProps) => {
  const tr = useTranslations(`pages.PrivacyPolicy.content.${section}`)

  const items = tr.has("items") ? tr("items") : null

  return (
    <section className="mt-6">
      {tr.has("title") && (
        <h2 className="mt-2 text-2xl mb-0.5">{tr("title")}</h2>
      )}
      {tr.has("description") && (
        <p className="text-justify">{tr("description")}</p>
      )}
      <ul className="list-disc list-inside">
        {items
          ? items.split(";;").map((item) => (
              <li key={item} className="text-justify">
                {item}
              </li>
            ))
          : null}
      </ul>
    </section>
  )
}

type RenderSubSectionProps = {
  section: string
}
const RenderSubSection = ({ section }: RenderSubSectionProps) => {
  const tr = useTranslations(`pages.PrivacyPolicy.content.${section}`)

  const items = tr.has("items") ? tr("items") : null

  return (
    <div>
      {tr.has("title") && <h3 className="text-lg mt-4">{tr("title")}</h3>}
      {tr.has("description") && (
        <p className="text-justify">{tr("description")}</p>
      )}
      <ul className="list-disc list-inside">
        {items
          ? items.split(";;").map((item) => (
              <li key={item} className="text-justify">
                {item}
              </li>
            ))
          : null}
      </ul>
    </div>
  )
}

export default RulesPage
