import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import './globals.css'
import '@/styles/card-effects.css'
import { Analytics } from '@vercel/analytics/react'
import { AuthProvider } from "@/providers/session-provider";
import ErrorBoundary from "@/components/error-boundary";
import { PageAnimationProvider } from "@/components/animations";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: "AI Promote - AI-Powered Marketing Strategy Platform",
  description: "Transform your startup's marketing with AI-generated content strategies, social media management, and automated campaign optimization.",
  keywords: ["AI marketing", "content strategy", "social media", "startup marketing", "automation"],
  authors: [{ name: "AI Promote Team" }],
  creator: "AI Promote",
  publisher: "AI Promote",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "AI Promote",
    title: "AI Promote - AI-Powered Marketing Strategy Platform",
    description: "Transform your startup's marketing with AI-generated content strategies, social media management, and automated campaign optimization.",
    images: [{
      url: "/og-image.png",
      width: 1200,
      height: 630,
      alt: "AI Promote - AI-Powered Marketing"
    }]
  },
  twitter: {
    card: "summary_large_image",
    site: "@aipromotapp",
    creator: "@aipromotapp",
    title: "AI Promote - AI-Powered Marketing Strategy Platform",
    description: "Transform your startup's marketing with AI-generated content strategies, social media management, and automated campaign optimization.",
    images: ["/og-image.png"]
  },
  manifest: "/manifest.json"
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3b82f6'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <AuthProvider>
            <PageAnimationProvider
              defaultTransitionType="basic"
              defaultEffect="mixed"
              defaultDuration={0.3}
              enableProgressBar={true}
            >
              {children}
            </PageAnimationProvider>
          </AuthProvider>
        </ErrorBoundary>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  );
}
