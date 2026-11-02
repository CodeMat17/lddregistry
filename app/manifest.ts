import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NFVCB LDD Registry (Prototype)",
    short_name: "LDD Registry",
    description: "Licensing and Documentation Department registry prototype. Local data only.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f9fb",
    theme_color: "#1d2f55",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  }
}
