"use client"

import { Toaster } from "@/components/ui/toaster"
import RulesProvider from "@/contexts/RulesContext"
import SettingsProvider from "@/contexts/SettingsContext"
import UserProvider from "@/contexts/UserContext"
import { Locales } from "@/i18n/routing"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
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
    enable_heatmaps: false,
    capture_heatmaps: false,
    capture_dead_clicks: false,
    rate_limiting: {
      events_per_second: 5,
    },
  })
}

const queryClient = new QueryClient()

type ProvidersProps = PropsWithChildren<{ locale: Locales }>
const Providers = ({ children, locale }: ProvidersProps) => {
  return (
    <PostHogProvider client={posthog}>
      <QueryClientProvider client={queryClient}>
        <RulesProvider>
          <SettingsProvider locale={locale}>
            <UserProvider>
              <LazyMotion strict features={domAnimation}>
                {children}
              </LazyMotion>
            </UserProvider>
            <Toaster />
          </SettingsProvider>
        </RulesProvider>
        <Toaster />
      </QueryClientProvider>
    </PostHogProvider>
  )
}

export default Providers
