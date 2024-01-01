"use client";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import SerialProvider from "./components/SerialProvider/SerialProvider";

const inter = Inter({ subsets: ["latin"] });

// export const metadata: Metadata = {
//   title: 'Mayhem Hub',
//   description: 'Web interface for everything HackRF/Portapack',
// }

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode
// }) {
//   return (
//     <html lang="en">
//       <body className={inter.className}>{children}</body>
//     </html>
//   )
// }

const RootLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <SerialProvider>
      <html lang="en">
        <body className={inter.className}>{children}</body>
      </html>
    </SerialProvider>
  );
};

export default RootLayout;
