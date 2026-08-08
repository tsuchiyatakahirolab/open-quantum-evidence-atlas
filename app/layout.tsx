import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    metadataBase: new URL(origin),
    title: "Open Quantum Evidence Atlas | EU–Japan",
    description: "Only 17 of 645 EU–Japan quantum publications expose a complete publication-centred project/funder–dataset–software path in OpenAIRE.",
    authors: [{ name: "Takahiro Tsuchiya", url: "https://tsuchiyatakahiro.com" }],
    creator: "Takahiro Tsuchiya",
    publisher: "Takahiro Tsuchiya",
    alternates: { canonical: "https://atlas.tsuchiyatakahiro.com" },
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "Funding is visible. Reuse links are not.",
      description: "Only 17 of 645 EU–Japan quantum publications expose a complete evidence chain.",
      type: "website",
      url: "https://atlas.tsuchiyatakahiro.com",
      images: [{ url: `${origin}/og-atlas.png`, width: 1536, height: 1024, alt: "Open Quantum Evidence Atlas: funding is visible; reuse links are not" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Funding is visible. Reuse links are not.",
      description: "Only 17 of 645 EU–Japan quantum publications expose a complete evidence chain.",
      images: [`${origin}/og-atlas.png`],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
