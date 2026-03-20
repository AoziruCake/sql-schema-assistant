import type { Metadata } from "next";
import "./globals.css";

const BASE_URL = "https://sql.sugirep.com";
const DESCRIPTION =
  "Design database table schemas and generate SQL — CREATE TABLE, INSERT, UPDATE, SELECT — entirely in your browser. Supports PostgreSQL, MySQL, and SQLite. 100% local processing; your data never leaves the browser.";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "SQL Schema Assistant",
    template: "%s | SQL Schema Assistant",
  },
  description: DESCRIPTION,
  keywords: [
    "SQL schema designer",
    "CREATE TABLE generator",
    "PostgreSQL schema",
    "MySQL schema",
    "SQLite schema",
    "database schema tool",
    "SQL generator",
    "browser SQL tool",
    "no backend",
    "privacy first",
  ],
  authors: [{ name: "AoziruCake", url: "https://github.com/AoziruCake" }],
  creator: "AoziruCake",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    title: "SQL Schema Assistant",
    description: DESCRIPTION,
    url: `${BASE_URL}/`,
    siteName: "SQL Schema Assistant",
    images: ["/opengraph-image.png"],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "SQL Schema Assistant",
    description: DESCRIPTION,
    images: ["/opengraph-image.png"],
    creator: "@Sugirep",
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  alternates: {
    canonical: `${BASE_URL}/`,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "SQL Schema Assistant",
  url: `${BASE_URL}/`,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Web Browser",
  browserRequirements: "Requires JavaScript. Compatible with modern browsers.",
  description: DESCRIPTION,
  inLanguage: ["en", "ja", "es"],
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  author: {
    "@type": "Person",
    name: "AoziruCake",
    url: "https://github.com/AoziruCake",
  },
  sameAs: ["https://github.com/AoziruCake/sql-schema-assistant"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link
          rel="alternate icon"
          href="/favicon-192.png"
          type="image/png"
          sizes="192x192"
        />
        <link
          rel="apple-touch-icon"
          href="/apple-touch-icon.png"
          sizes="180x180"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}
