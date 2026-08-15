import { Fraunces, IBM_Plex_Mono, IBM_Plex_Sans, Nunito } from "next/font/google"
import type { Metadata } from "next"

import "@kyberry/ui/globals.css"
import "./theme.css"

const fontMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
})

/* Merchant-preset faces. Each checkout preset renders the shell card in one of
 * these while the hosted iframe loads the same family through the SDK's
 * `fonts` passthrough, so type matches across the security boundary. */
const fontPlex = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-plex",
  weight: ["400", "500", "600"],
})

const fontFraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  style: ["normal", "italic"],
})

const fontNunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
})

export const metadata = {
  title: "Finix Headless SDK Playground",
  description: "Customization and lifecycle playground for the typed Finix client SDK.",
} satisfies Metadata

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* No shell display face: the tool chrome uses the system font stack.
          The loaded families serve the mono API surface and the merchant
          presets. */}
      <body
        className={`${fontMono.variable} ${fontPlex.variable} ${fontFraunces.variable} ${fontNunito.variable} min-h-screen font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
