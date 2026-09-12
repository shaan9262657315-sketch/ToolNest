import "./globals.css";
import { Header } from "@/components/Header";
import type { Metadata } from "next";
import Script from "next/script";

const SITE_URL = "https://tool-nest-phi.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: "ToolNest — Free Online Tools | Shaan E Sahil",
    template: "%s | ToolNest",
  },

  description:
    "ToolNest by Shaan E Sahil — free online calculators, converters, student tools, PDF tools and productivity tools.",

  keywords: [
    "ToolNest",
    "Shaan E Sahil",
    "free online tools",
    "online calculators",
    "online converters",
    "PDF tools",
    "student tools",
    "productivity tools",
  ],

  authors: [{ name: "Shaan E Sahil" }],
  creator: "Shaan E Sahil",
  publisher: "Shaan E Sahil",

  verification: {
    google: "e3ade397ba1ed86c",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },

  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "ToolNest — Free Online Tools",
    description:
      "Free calculators, converters, student tools, PDF tools and productivity tools.",
    siteName: "ToolNest",
  },

  twitter: {
    card: "summary",
    title: "ToolNest — Free Online Tools",
    description:
      "Free online calculators, converters, PDF tools and student tools.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}

        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-HLFJ5DQ7C5"
          strategy="afterInteractive"
        />

        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-HLFJ5DQ7C5');
          `}
        </Script>
      </body>
    </html>
  );
}
