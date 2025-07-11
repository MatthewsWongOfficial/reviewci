import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ReviewCI - Smart CI Pipeline Analyzer',
  description: 'ReviewCI is a smart CI pipeline analyzer for GitHub Actions, GitLab CI, and Bitbucket Pipelines. Instantly detect misconfigurations, surface hidden security risks, and get actionable suggestions to optimize your builds — just paste your YAML and let ReviewCI do the rest.',
  keywords: ['CI/CD', 'GitHub Actions', 'GitLab CI', 'Bitbucket Pipelines', 'YAML analyzer', 'pipeline optimization', 'security analysis', 'DevOps'],
  authors: [{ name: 'Matthews Wong', url: 'https://matthewswong.tech' }],
  creator: 'ReviewCI',
  publisher: 'ReviewCI',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://reviewci.matthewswong.tech'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'ReviewCI - Smart CI Pipeline Analyzer',
    description: 'Instantly detect misconfigurations, surface hidden security risks, and get actionable suggestions to optimize your CI/CD builds. Support for GitHub Actions, GitLab CI, and Bitbucket Pipelines.',
    url: 'https://reviewci.matthewswong.tech',
    siteName: 'ReviewCI',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ReviewCI - Smart CI Pipeline Analyzer',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ReviewCI - Smart CI Pipeline Analyzer',
    description: 'Instantly detect misconfigurations, surface hidden security risks, and get actionable suggestions to optimize your CI/CD builds.',
    images: ['/og-image.png'],
    creator: '@reviewci',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" href="/android-chrome-192x192.png" sizes="192x192" type="image/png" />
        <link rel="icon" href="/android-chrome-512x512.png" sizes="512x512" type="image/png" />
        <link rel="manifest" href="/site.webmanifest" />
        <meta name="theme-color" content="#0F172A" />
        <meta name="msapplication-TileColor" content="#0F172A" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 font-inter antialiased">
        <div className="relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800 bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]" />
          
          {/* Main Content */}
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </body>
    </html>
  )
}