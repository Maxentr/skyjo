"use client"

import { Link } from "@/i18n/routing"
import { m } from "framer-motion"
import { ArrowDown } from "lucide-react"

type Props = {
  href: string
}

const MovingArrow = ({ href }: Props) => {
  return (
    <Link href={href}>
      <m.div
        initial={{ translateY: 0 }}
        animate={{ translateY: "12px" }}
        transition={{
          duration: 0.5,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      >
        <ArrowDown className="text-black dark:text-dark-font" />
      </m.div>
    </Link>
  )
}

export default MovingArrow
