import type { MetadataRoute } from "next";

// What iOS and Android read when Trips is saved to the home screen. Standalone
// drops the browser's address bar and toolbars; the background is the splash
// blue so the launch screen does not flash white.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Trips",
    short_name: "Trips",
    description: "Places we want to go, and the trips we take them on.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0062cc",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
