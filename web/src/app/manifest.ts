import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  const staticPubId = process.env.NEXT_PUBLIC_R2_STATIC_MEDIA_BUCKET_PUBID || "";
  const logoUrl = staticPubId && staticPubId !== "undefined" 
    ? `${staticPubId}/Happnix_logo_full_transparent.svg` 
    : "/Happnix.png"; // Fallback to local image

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
        src: logoUrl,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any maskable"
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
