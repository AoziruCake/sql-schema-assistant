import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://sql.sugirep.com"),
  title: "SQL Schema Assistant",
  description:
    "Design database table schemas and generate SQL statements entirely in your browser. 100% local, privacy-first.",
  openGraph: {
    title: "SQL Schema Assistant",
    description:
      "Design database table schemas and generate SQL statements entirely in your browser. 100% local, privacy-first.",
    url: "https://sql.sugirep.com/",
    siteName: "SQL Schema Assistant",
    images: ["/opengraph-image.png"],
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "SQL Schema Assistant",
    description:
      "Design database table schemas and generate SQL statements entirely in your browser. 100% local, privacy-first.",
    images: ["/opengraph-image.png"]
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon-192.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
      </head>
      <body className="min-h-screen bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}
