"use client"

import { useRules } from "@/contexts/RulesContext"

type FooterRulesLinkProps = {
  text: string
}

const FooterRulesLink = ({ text }: FooterRulesLinkProps) => {
  const { openRules } = useRules()

  return (
    <button
      onClick={openRules}
      className="text-black dark:text-dark-font underline"
    >
      {text}
    </button>
  )
}

export { FooterRulesLink }
