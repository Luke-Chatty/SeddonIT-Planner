import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Import Inter font
import { Providers } from "@/components/Providers";
import "./globals.css";

// Configure Inter font
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
      <body className={`${inter.className} antialiased selection:bg-blue-500/30 selection:text-blue-900 dark:selection:bg-blue-500/30 dark:selection:text-blue-100`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}