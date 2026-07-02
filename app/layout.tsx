import type { Metadata, Viewport } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mygurm.app"),
  title: {
    default: "mygurm · photobooth for two",
    template: "%s · mygurm",
  },
  description:
    "mygurm is a photobooth for long-distance couples. Open a room, send the code, and snap a synced four-cut strip together — no matter how far apart you and me are.",
  keywords: [
    "long distance",
    "couples",
    "photobooth",
    "인생네컷",
    "date ideas",
    "video chat",
  ],
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "mygurm · photobooth for two",
    description:
      "A photobooth for long-distance couples. you + me, one synced strip.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "mygurm · photobooth for two",
    description:
      "A photobooth for long-distance couples. you + me, one synced strip.",
  },
};

export const viewport: Viewport = {
  themeColor: "#F8F9FB",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
