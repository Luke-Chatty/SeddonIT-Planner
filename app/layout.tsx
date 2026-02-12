import type { Metadata } from "next";
import { Source_Sans_3, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Seddon IT Planner",
  description: "Interactive infrastructure planning and management tool for Seddon IT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${sourceSans.variable} ${plusJakarta.variable} ${sourceSans.className} antialiased selection:bg-[#30b996]/30 selection:text-[#022943] dark:selection:bg-[#30b996]/30 dark:selection:text-white font-sans min-h-screen transition-colors duration-300`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}