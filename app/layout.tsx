import type { Metadata } from "next";
import { Inter, Rethink_Sans } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const rethinkSans = Rethink_Sans({
  subsets: ["latin"],
  variable: "--font-rethink-sans",
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
        className={`${inter.variable} ${rethinkSans.variable} ${inter.className} antialiased selection:bg-[#30b996]/30 selection:text-[#022943] dark:selection:bg-[#30b996]/30 dark:selection:text-white font-sans min-h-screen transition-colors duration-300`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}