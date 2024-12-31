"use client"

import { useFeedback } from "@/contexts/FeedbackContext"

type FooterFeedbackLinkProps = {
  text: string
}

const FooterFeedbackLink = ({ text }: FooterFeedbackLinkProps) => {
  const { openFeedback } = useFeedback()

  return (
    <button
      onClick={openFeedback}
      className="text-black dark:text-dark-font underline"
    >
      {text}
    </button>
  )
}

export { FooterFeedbackLink }
