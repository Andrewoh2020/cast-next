import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import FooterWrapper from "@/components/FooterWrapper";
import { Toaster } from "sonner";
import { readSeo } from "@/lib/seo.server";
import { ClerkProvider } from "@clerk/nextjs";
import Script from "next/script";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const seo = await readSeo();

  return {
    metadataBase: new URL(seo.canonicalUrl || "https://www.castability.ai"),
    title: {
      default: seo.siteTitle,
      template: seo.titleTemplate,
    },
    description: seo.description,
    keywords: seo.keywords,
    authors: [{ name: "Cast" }],
    creator: "Cast",
    openGraph: {
      type: "website",
      locale: "en_US",
      url: seo.canonicalUrl,
      siteName: seo.siteTitle,
      title: seo.siteTitle,
      description: seo.description,
      images: seo.ogImage
        ? [{ url: seo.ogImage, width: 1200, height: 630, alt: seo.siteTitle }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      site: seo.twitterHandle,
      creator: seo.twitterHandle,
      title: seo.siteTitle,
      description: seo.description,
      images: seo.ogImage ? [seo.ogImage] : [],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true },
    },
    alternates: {
      canonical: seo.canonicalUrl,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const seo = await readSeo();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: seo.siteTitle,
    url: seo.canonicalUrl,
    description: seo.description,
    logo: seo.ogImage,
    sameAs: seo.twitterHandle
      ? [`https://twitter.com/${seo.twitterHandle.replace("@", "")}`]
      : [],
  };

  return (
    <ClerkProvider>
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      {seo.googleAnalyticsId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${seo.googleAnalyticsId}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${seo.googleAnalyticsId}');`}
          </Script>
        </>
      )}
      <body className={`${geist.variable} antialiased`}>
        <Nav />
        {children}
        <FooterWrapper />
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
    </ClerkProvider>
  );
}
