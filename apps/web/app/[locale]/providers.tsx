"use client"

import { Toaster } from "@/components/ui/toaster"
import FeedbackProvider from "@/contexts/FeedbackContext"
import RulesProvider from "@/contexts/RulesContext"
import SettingsProvider from "@/contexts/SettingsContext"
import UserProvider from "@/contexts/UserContext"
import { Locales } from "@/i18n/routing"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { LazyMotion, domAnimation } from "framer-motion"
import posthog from "posthog-js"
import {
  sampleByDistinctId,
  sampleByEvent,
} from "posthog-js/lib/src/customizations"
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
    autocapture: {
      element_attribute_ignorelist: ['data-attr-pii="game-card"'],
    },
    rate_limiting: {
      events_per_second: 5,
    },
    before_send: [
      sampleByDistinctId(0.8),
      sampleByEvent(
        ["$$heatmap", "$heatmaps_data", "$web_vitals", "$dead_click"],
        0.5,
      ),
    ],
  })
}

const queryClient = new QueryClient()

type ProvidersProps = PropsWithChildren<{ locale: Locales }>
const Providers = ({ children, locale }: ProvidersProps) => {
  return (
    <PostHogProvider client={posthog}>
      <QueryClientProvider client={queryClient}>
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
      </QueryClientProvider>
    </PostHogProvider>
  )
}

export default Providers
