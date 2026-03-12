import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { readSeo } from "@/lib/seo.server";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const seo = await readSeo();

  return {
    metadataBase: new URL(seo.canonicalUrl || "https://cast-next-silk.vercel.app"),
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
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {seo.googleAnalyticsId && (
          <>
            <script async src={`https://www.googletagmanager.com/gtag/js?id=${seo.googleAnalyticsId}`} />
            <script
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${seo.googleAnalyticsId}');`,
              }}
            />
          </>
        )}
      </head>
      <body className={`${geist.variable} antialiased`}>
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
