"use client"

import { Toaster } from "@/components/ui/toaster"
import FeedbackProvider from "@/contexts/FeedbackContext"
import RulesProvider from "@/contexts/RulesContext"
import SettingsProvider from "@/contexts/SettingsContext"
import UserProvider from "@/contexts/UserContext"
import { Locales } from "@/i18n/routing"
import { LazyMotion, domAnimation } from "framer-motion"
import posthog from "posthog-js"
import { PostHogProvider } from "posthog-js/react"
import { PropsWithChildren } from "react"

if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    person_profiles: "identified_only",
    persistence: "memory",
    capture_pageview: false,
    capture_pageleave: true,
    opt_in_site_apps: true,
  })
}

type ProvidersProps = PropsWithChildren<{ locale: Locales }>
const Providers = ({ children, locale }: ProvidersProps) => {
  return (
    <PostHogProvider client={posthog}>
      <FeedbackProvider>
        <RulesProvider>
          <SettingsProvider locale={locale}>
            <FeedbackProvider>
              <UserProvider>
                <LazyMotion strict features={domAnimation}>
                  {children}
                </LazyMotion>
              </UserProvider>
              <Toaster />
            </FeedbackProvider>
          </SettingsProvider>
        </RulesProvider>
      </FeedbackProvider>
      <Toaster />
    </PostHogProvider>
  )
}

export default Providers
