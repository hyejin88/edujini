import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://edujini.pages.dev'),
  title: {
    default: 'EDU Jini - 단원별 무료 수학 학습지',
    template: '%s | EDU Jini',
  },
  description: '초1~초6 단원별 수학 학습지. NCIC 성취기준 기반, AI 자동 채점·해설, A4 인쇄 가능.',
  keywords: ['초등 수학 학습지', '초3 수학 학습지', '수학 단원평가', '기출문제 무료', 'AI 자동 채점', 'NCIC 성취기준', 'A4 학습지', '무료 수학 문제집'],
  openGraph: {
    title: 'EDU Jini - 단원별 무료 수학 학습지',
    description: '초1~초6 NCIC 성취기준 기반 수학 학습지. AI 자동 채점·해설 + A4 인쇄.',
    url: 'https://edujini.pages.dev',
    siteName: 'EDU Jini',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EDU Jini - 단원별 무료 수학 학습지',
    description: '초1~초6 NCIC 성취기준 기반 수학 학습지.',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className="bg-background">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
