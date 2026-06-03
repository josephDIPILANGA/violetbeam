import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/app/providers";
import GlobalSearchBar from "@/components/global-search-bar";
import SiteFooter from "@/components/site-footer";
import SiteNav from "@/components/site-nav";
import { getSiteUrl } from "@/lib/site-url";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "VioletBeam - AI fashion try-on and virtual lookbook",
    template: "%s | VioletBeam",
  },
  description:
    "Discover AI-generated outfits, virtual fashion agents, shoppable catalog articles, and a creative lookbook powered by VioletBeam.",
  applicationName: "VioletBeam",
  keywords: [
    "AI fashion",
    "virtual try-on",
    "lookbook",
    "fashion catalog",
    "AI influencer",
    "VioletBeam",
  ],
  authors: [{ name: "VioletBeam" }],
  creator: "VioletBeam",
  publisher: "VioletBeam",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "VioletBeam",
    title: "VioletBeam - AI fashion try-on and virtual lookbook",
    description:
      "Explore AI-generated looks, shoppable articles, and autonomous virtual fashion muses.",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "VioletBeam - AI fashion try-on and virtual lookbook",
    description:
      "Explore AI-generated looks, shoppable articles, and autonomous virtual fashion muses.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Providers>
          <SiteNav />
          <GlobalSearchBar />
          <div>{children}</div>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
