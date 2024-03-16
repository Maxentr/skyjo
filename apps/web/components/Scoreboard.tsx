"use client"

import ScoreDialog from "@/components/ScoreDialog"
import { Button } from "@/components/ui/button"
import { ListIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { useState } from "react"

const Scoreboard = () => {
  const t = useTranslations("components.Scoreboard")

  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        size="icon"
        variant="ghost"
        onClick={() => setOpen(!open)}
        title={t("button-title")}
        className="w-6 h-6"
      >
        <ListIcon />
      </Button>

      <ScoreDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

export default Scoreboard
