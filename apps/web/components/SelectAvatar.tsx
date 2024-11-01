"use client"

import { AVATARS_ARRAY, useUser } from "@/contexts/UserContext"
import { cn } from "@/lib/utils"
import { AnimatePresence, m } from "framer-motion"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import Image from "next/image"

type SelectAvatarProps = {
  containerClassName?: string
}

const SelectAvatar = ({ containerClassName }: SelectAvatarProps) => {
  const { avatarIndex, setAvatarIndex, getAvatar } = useUser()
  const tAvatar = useTranslations("utils.avatar")

  const handlePrevious = () => {
    const newIndex =
      avatarIndex === 0 ? AVATARS_ARRAY.length - 1 : avatarIndex - 1

    setAvatarIndex(newIndex)
  }

  const handleNext = () => {
    const newIndex =
      avatarIndex === AVATARS_ARRAY.length - 1 ? 0 : avatarIndex + 1
    setAvatarIndex(newIndex)
  }

  const avatar = getAvatar()

  return (
    <div className={cn("flex flex-row gap-2 items-center", containerClassName)}>
      <ChevronLeftIcon
        className="h-6 w-6 cursor-pointer text-black dark:text-dark-font"
        onClick={handlePrevious}
      />
      <AnimatePresence mode="popLayout" initial={false}>
        <m.div
          key={avatarIndex}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.3 }}
        >
          {avatar ? (
            <Image
              src={`/avatars/${avatar}.svg`}
              width={100}
              height={100}
              alt={tAvatar(avatar)}
              title={tAvatar(avatar)}
              className="select-none size-12 smh:sm:size-16 mdh:md:size-[6.25rem] dark:opacity-75"
              priority
            />
          ) : (
            <div className="size-12 smh:sm:size-16 mdh:md:size-[6.25rem] bg-zinc-200 rounded-3xl animate-pulse scale-50" />
          )}
        </m.div>
      </AnimatePresence>
      <ChevronRightIcon
        className="h-6 w-6 cursor-pointer text-black dark:text-dark-font"
        onClick={handleNext}
      />
    </div>
  )
}

export default SelectAvatar
