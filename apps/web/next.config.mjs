import createNextIntlPlugin from "next-intl/plugin"
import creatNextPwa from "next-pwa"

const withPWA = creatNextPwa({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
})

const withNextIntl = createNextIntlPlugin()

/** @type {import('next').NextConfig} */
const nextConfig = {
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },
}

export default withPWA(withNextIntl(nextConfig))
