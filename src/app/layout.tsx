import type { Metadata } from "next";
import localFont from "next/font/local";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const nativera = localFont({
  src: [
    { path: "./fonts/Nativera-Light.ttf", weight: "300" },
    { path: "./fonts/Nativera-Regular.ttf", weight: "400" },
    { path: "./fonts/Nativera-Medium.ttf", weight: "500" },
    { path: "./fonts/Nativera-Semibold.ttf", weight: "600" },
  ],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PomoFlow — Focus, Flow, Achieve",
  description:
    "A premium Pomodoro timer with ambient sounds, Notion integration, and beautiful statistics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${nativera.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
