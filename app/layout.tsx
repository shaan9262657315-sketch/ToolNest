import "./globals.css";
import { Header } from "@/components/Header";

export const metadata = {
  metadataBase: new URL("https://toolnest.example.com"),

  title: {
    default: "ToolNest — Free Online Tools | Shaan E Sahil",
    template: "%s | ToolNest",
  },

  description:
    "ToolNest by Shaan E Sahil — free online calculators, converters, developer tools, student utilities, PDF tools and productivity tools.",

  keywords: [
    "ToolNest",
    "Shaan E Sahil",
    "free online tools",
    "online calculators",
    "online converters",
    "PDF tools",
    "developer tools",
    "student tools",
    "productivity tools",
  ],

  authors: [{ name: "Shaan E Sahil" }],
  creator: "Shaan E Sahil",
  publisher: "Shaan E Sahil",

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    title: "ToolNest — Free Online Tools",
    description:
      "Free calculators, converters, developer tools, PDF tools, student utilities and more.",
    type: "website",
    siteName: "ToolNest",
  },

  twitter: {
    card: "summary",
    title: "ToolNest — Free Online Tools",
    description:
      "Free online calculators, converters, PDF tools, developer tools and more.",
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
      </body>
    </html>
  );
}
