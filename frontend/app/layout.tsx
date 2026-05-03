import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { AdSenseScript } from '@/components/AdSlot'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://edujini.pages.dev'),
  title: {
    default: 'EDU Jini - 단원별 무료 수학 학습지',
    template: '%s | EDU Jini',
  },
  description: '아이 오답 유형까지 분석해서 다음 문제를 골라주는 초등 수학 학습 사이트. 초1~초6 NCIC 성취기준, 단원 학습 + 연산 + 학부모 리포트.',
  keywords: ['초등 수학 학습지', '초3 수학 학습지', '수학 단원평가', '기출문제 무료', 'AI 자동 채점', 'NCIC 성취기준', 'A4 학습지', '무료 수학 문제집'],
  openGraph: {
    title: 'EDU Jini - 단원별 무료 수학 학습지',
    description: '초1~초6 NCIC 성취기준 기반 수학 학습지. AI 자동 채점·해설 + A4 인쇄.',
    url: 'https://edujini.pages.dev',
    siteName: 'EDU Jini',
    locale: 'ko_KR',
    type: 'website',
    images: [{ url: '/logo-og.png', width: 1200, height: 630, alt: 'EDU Jini' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EDU Jini - 단원별 무료 수학 학습지',
    description: '초1~초6 NCIC 성취기준 기반 수학 학습지.',
    images: ['/logo-og.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: 'sb91Xzfjji8oYiAdLZfyyKZcYZJkF_9_YgCISPJOfFI',
    // 네이버 코드 받으면 추가:
    // other: { 'naver-site-verification': 'xxxxxxxxxxxxxxxx' },
  },
  // icons는 app/icon.png + app/apple-icon.png Next.js 자동 인식 사용 (별도 메타 X)
}

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "EDU Jini",
  alternateName: "에듀 지니",
  url: "https://edujini.pages.dev",
  logo: "https://edujini.pages.dev/logo.png",
  description: "초1~초6 NCIC 성취기준 기반 무료 수학 학습 사이트. AI 자동 채점·4축 오답 분석·학부모 리포트.",
  sameAs: [],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "EDU Jini",
  url: "https://edujini.pages.dev",
  inLanguage: "ko",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://edujini.pages.dev/library?grade={grade}&subject=수학&mode=comp",
    "query-input": "required name=grade",
  },
};

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
        {/* AdSense 사이트 소유권 확인 + 광고 로드 베이스 스크립트 */}
        <AdSenseScript />
        {/* JSON-LD 구조화 데이터 — Organization + WebSite (전 사이트 공통) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
