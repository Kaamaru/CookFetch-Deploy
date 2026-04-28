import type { ReactNode } from "react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import AppProviders from "@/components/AppProviders";
import {
  getMetadataTranslations,
  normalizeMetadataLanguage,
} from "@/lib/metadataTranslations";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const cookieStore = await cookies();
  const language = normalizeMetadataLanguage(
    cookieStore.get("cookfetch-lang")?.value,
  );
  const m = getMetadataTranslations(language);

  return {
    metadataBase: new URL("https://cook-fetch-app-next.vercel.app"),
    title: {
      default: m.appTitleDefault,
      template: m.appTitleTemplate,
    },
    description: m.appDescription,
    keywords: [...m.appKeywords],
    authors: [{ name: m.authorName }],
    creator: m.appCreator,
    publisher: m.appPublisher,
    alternates: {
      canonical: "https://cook-fetch-app-next.vercel.app",
    },
    openGraph: {
      type: "website",
      url: "https://cook-fetch-app-next.vercel.app",
      title: m.openGraphTitle,
      description: m.openGraphDescription,
      siteName: m.appSiteName,
      locale: language === "th" ? "th_TH" : "en_US",
      images: [
        {
          url: "/hero_red.png",
          width: 1200,
          height: 630,
          alt: m.openGraphAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: m.twitterTitle,
      description: m.twitterDescription,
      images: ["/hero_red.png"],
      creator: m.twitterHandle,
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    category: "food",
  };
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white">
        <AppProviders>
          <main className="relative z-0 min-h-screen bg-white">{children}</main>
        </AppProviders>
      </body>
    </html>
  );
}
