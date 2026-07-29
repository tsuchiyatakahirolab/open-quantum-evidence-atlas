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
    description: "An OpenAIRE evidence-chain audit of funding, projects, publications, datasets and software in EU–Japan quantum research.",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "Funding is visible. Reuse is not.",
      description: "645 EU–Japan quantum publications. One inspectable evidence gap.",
      type: "website",
      url: origin,
      images: [{ url: `${origin}/og-atlas-v1.2.png`, width: 1536, height: 1024, alt: "Open Quantum Evidence Atlas: Funding is visible. Reuse is not." }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Funding is visible. Reuse is not.",
      description: "645 EU–Japan quantum publications. One inspectable evidence gap.",
      images: [`${origin}/og-atlas-v1.2.png`],
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
