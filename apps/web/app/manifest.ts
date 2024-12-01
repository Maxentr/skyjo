import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Skyjo",
    short_name: "Skyjo",
    description: "Skyjo online PWA",
    start_url: "/",
    orientation: "portrait",
    display: "standalone",
    background_color: "#fefdf7",
    theme_color: "#fefdf7",
    icons: [
      {
        src: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    related_applications: [
      {
        platform: "Skyjo online",
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/manifest.json`,
      },
    ],
  }
}
