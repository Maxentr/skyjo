"use client"

import { cn } from "@/lib/utils"
import { SkyjoCardToJson } from "@skyjo/core"
import { VariantProps, cva } from "class-variance-authority"
import { ClassValue } from "clsx"
import { m, useAnimate, useAnimationControls } from "framer-motion"
import { Trash2Icon } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

const cardClass = cva(
  "text-black border-2 border-black flex justify-center items-center select-none focus-visible:outline-black focus-visible:-outline-offset-2",
  {
    variants: {
      size: {
        preview: " h-3 w-2 border rounded-sm text-transparent",
        tiny: " h-12 w-8 border-[1.5px] rounded shadow-[0.75px_0.75px_0px_0px_rgba(0,0,0)] text-base",
        normal:
          " h-8 w-6 smh:h-12 smh:w-8 xlh:md:h-16 xlh:md:w-12 rounded smh:rounded xlh:md:rounded-md shadow-[0.75px_0.75px_0px_0px_rgba(0,0,0)] xlh:md:shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0)] text-base xlh:md:text-2xl ",
        big: " h-8 w-6 smh:h-16 smh:w-12 xlh:md:h-20 xlh:md:w-14 rounded smh:rounded xlh:md:rounded-md shadow-[0.75px_0.75px_0px_0px_rgba(0,0,0)] xlh:md:shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0)] text-base xlh:md:text-2xl ",
      },
      value: {
        discard:
          "bg-transparent border-dashed border-card-discard dark:border-dark-card-discard !shadow-none",
        "no-card":
          "bg-transparent border-dashed border-black dark:border-dark-border dark:border-dark-card-empty !shadow-none",
        "not-visible":
          " bg-card-not-visible text-card-not-visible dark:bg-dark-card-not-visible dark:text-dark-card-not-visible ",
        negative: " bg-card-negative dark:bg-dark-card-negative ",
        neutral: " bg-card-neutral dark:bg-dark-card-neutral ",
        low: " bg-card-low dark:bg-dark-card-low ",
        medium: "bg-card-medium dark:bg-dark-card-medium ",
        high: " bg-card-high dark:bg-dark-card-high ",
      },
      disabled: {
        true: "",
        false: "",
      },
    },
  },
)

const throwIconClass = cva(
  "aspect-square text-card-discard dark:text-dark-card-discard ",
  {
    variants: {
      size: {
        preview: "w-0",
        tiny: "w-4",
        small: " w-5",
        normal: " w-5 md:w-6",
        big: " w-8",
      },
    },
  },
)

type CardValue =
  | "no-card"
  | "discard"
  | "not-visible"
  | "negative"
  | "neutral"
  | "low"
  | "medium"
  | "high"

const cardValue: Record<string, CardValue> = {
  "-99": "no-card",
  "-98": "discard",
  "not-visible": "not-visible",
  "-2": "negative",
  "-1": "negative",
  "0": "neutral",
  "1": "low",
  "2": "low",
  "3": "low",
  "4": "low",
  "5": "medium",
  "6": "medium",
  "7": "medium",
  "8": "medium",
  "9": "high",
  "10": "high",
  "11": "high",
  "12": "high",
}

type CardProps = {
  card: SkyjoCardToJson
  size?: VariantProps<typeof cardClass>["size"]
  onClick?: () => void
  className?: ClassValue
  title?: string
  disabled?: boolean
  flipAnimation?: boolean
  exitAnimation?: boolean
}
const Card = ({
  card,
  size = "normal",
  onClick,
  className,
  title,
  disabled = false,
  flipAnimation = true,
  exitAnimation = false,
}: CardProps) => {
  const [scope, animate] = useAnimate()
  const { theme, systemTheme } = useTheme()
  const controls = useAnimationControls()

  const [value, setValue] = useState<number | undefined>(undefined)

  useEffect(() => {
    const turnCard = async () => {
      const currentTheme = theme === "system" ? systemTheme : theme

      if (currentTheme === "light") {
        controls.set({
          rotateY: -180,
          // card-not-visible
          backgroundColor: "#fefdf7",
          color: "#fefdf7",
        })
      } else {
        controls.set({
          rotateY: -180,
          // dark-card-not-visible
          backgroundColor: "#5a5a58",
          color: "#5a5a58",
        })
      }

      const animation = animate(
        scope.current,
        {
          rotateY: 0,
          transformStyle: "preserve-3d",
        },
        {
          duration: 0.4,
        },
      )

      animate(
        scope.current,
        {
          backgroundColor: "revert-layer",
          color: "revert-layer",
        },
        {
          delay: 0.15,
        },
      )

      await Promise.all([animation])

      controls.set({ rotateY: 0 })
    }
    setValue(card.value)
    if (flipAnimation && card.isVisible && card.value !== value) {
      turnCard()
    }
  }, [flipAnimation, card.isVisible, card.value, controls, animate, scope])

  const exitAnimationValue = exitAnimation
    ? {
        opacity: 0,
        scale: 0,
        transition: {
          duration: 2,
          ease: "easeInOut",
        },
      }
    : undefined

  return (
    <m.button
      ref={scope}
      animate={controls}
      exit={exitAnimationValue}
      className={cn(
        "ph-no-capture",
        cardClass({
          size,
          value: cardValue[value ?? "not-visible"],
          disabled,
        }),
        className,
      )}
      onClick={onClick}
      title={title}
      disabled={disabled}
    >
      {value === -98 && <Trash2Icon className={throwIconClass({ size })} />}
      {card.isVisible && value !== null && value}
    </m.button>
  )
}

export { Card }
