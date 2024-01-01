import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mayhem Hub",
  description: "Web interface for everything HackRF/Portapack",
  generator: "Next.js",
  manifest: "/manifest.json",
  keywords: ["Portapack", "HackRF", "mayhem", "portapack-mayhem"],
  themeColor: [{ media: "(prefers-color-scheme: dark)", color: "#3f3f3f" }],
  authors: [
    { name: "Mayhem" },
    {
      name: "Mayhem",
      url: "https://github.com/portapack-mayhem",
    },
  ],
  viewport:
    "minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover",
  icons: [
    { rel: "apple-touch-icon", url: "icons/icon-128x128.png" },
    { rel: "icon", url: "icons/icon-128x128.png" },
  ],
};

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
};

export default RootLayout;
