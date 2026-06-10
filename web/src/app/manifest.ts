import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Happnix",
    short_name: "Happnix",
    description: "Find Your Next Experience",
    start_url: "/",
    display: "standalone",
    background_color: "#050508",
    theme_color: "#050508",
    icons: [
      {
        src: "/Happnix.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable"
      },
      {
        src: "/Happnix.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      }
    ]
  }
}
