import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppNav from "./app-nav";
import Splash from "./splash";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// iOS shows these while the home-screen app launches, before any script runs:
// the same blue-and-pin as <Splash />, one per iPhone screen
// [css width, css height, pixel ratio]. Regenerate if new sizes ship.
const STARTUP_SCREENS = [
  [440, 956, 3], [420, 912, 3], [402, 874, 3], [430, 932, 3], [393, 852, 3], [428, 926, 3],
  [390, 844, 3], [375, 812, 3], [414, 896, 3], [414, 896, 2], [414, 736, 3],
  [375, 667, 2], [320, 568, 2],
] as const;

export const metadata: Metadata = {
  title: "Trips",
  description: "Places we want to go, and the trips we take them on.",
  applicationName: "Trips",
  // Saved to the iOS home screen, it opens full screen with no Safari chrome.
  // "default" keeps the status bar solid and follows the system appearance, so
  // the clock stays legible on light and dark pages and nothing blurs under it.
  appleWebApp: {
    capable: true,
    title: "Trips",
    statusBarStyle: "default",
    startupImage: STARTUP_SCREENS.map(([w, h, r]) => ({
      url: `/splash/${w * r}x${h * r}.png`,
      media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)`,
    })),
  },
  formatDetection: { telephone: false },
  icons: { apple: "/apple-touch-icon.png" },
};

// No viewport-fit=cover, on purpose: with it iOS 26 lets content run under the
// status bar and blurs it (the glass edge). Without it the status bar stays
// outside the page, so nothing sits beneath to blur. No zoom stops iOS from
// magnifying on focus and double tap.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1c1e" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}
        <AppNav />
        <Splash />
      </body>
    </html>
  );
}
