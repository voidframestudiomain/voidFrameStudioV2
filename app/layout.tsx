import type { Metadata } from "next";
import localFont from "next/font/local";
import { Anton } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import LenisProvider from "@/components/LenisProvider";

const ppMori = localFont({
  src: [
    { path: "./fonts/PPMori-Extralight.otf", weight: "200", style: "normal" },
    { path: "./fonts/PPMori-ExtralightItalic.otf", weight: "200", style: "italic" },
    { path: "./fonts/PPMori-Regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/PPMori-RegularItalic.otf", weight: "400", style: "italic" },
    { path: "./fonts/PPMori-SemiBold.otf", weight: "600", style: "normal" },
    { path: "./fonts/PPMori-SemiBoldItalic.otf", weight: "600", style: "italic" },
  ],
  variable: "--font-pp-mori",
  display: "swap",
});

const anton = Anton({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-anton",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://voidframe.com"),
  title: "Voidframe — Design & Development",
  description:
    "Voidframe is a design and development studio building high-performance digital experiences for brands that take their craft seriously.",
  keywords: [
    "design agency",
    "web development",
    "digital studio",
    "branding",
    "UI/UX",
    "creative agency",
    "voidframe",
  ],
  authors: [{ name: "Voidframe" }],
  openGraph: {
    title: "Voidframe — Design & Development",
    description:
      "High-performance digital experiences for brands that take their craft seriously.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
    siteName: "Voidframe",
    type: "website",
    url: "https://voidframe.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Voidframe — Design & Development",
    description:
      "High-performance digital experiences for brands that take their craft seriously.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${ppMori.variable} ${anton.variable} dark `}>
      <body className="min-h-screen bg-zinc-950 text-white antialiased overflow-x-hidden">
        <LenisProvider>{children}</LenisProvider>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}