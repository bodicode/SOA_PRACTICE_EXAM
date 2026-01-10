import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ClientLayout } from "@/components/ClientLayout";
import StructuredData from "@/components/StructuredData";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "SOA Exam Practice - Luyện thi Actuary hàng đầu Việt Nam",
    template: "%s | SOA Exam Practice"
  },
  description: "Nền tảng luyện thi SOA Actuarial #1 Việt Nam với hàng ngàn câu hỏi, theo dõi tiến độ chi tiết và chế độ thi đấu. Chuẩn bị tốt nhất cho kỳ thi SOA với chúng tôi.",
  keywords: ["SOA", "Actuary", "Actuarial", "luyện thi", "practice exam", "SOA exam", "actuarial science", "Việt Nam"],
  authors: [{ name: "SOA Exam Practice" }],
  creator: "SOA Exam Practice",
  publisher: "SOA Exam Practice",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "SOA Exam Practice - Luyện thi Actuary hàng đầu Việt Nam",
    description: "Nền tảng luyện thi SOA Actuarial #1 Việt Nam với hàng ngàn câu hỏi, theo dõi tiến độ chi tiết và chế độ thi đấu.",
    url: '/',
    siteName: 'SOA Exam Practice',
    locale: 'vi_VN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "SOA Exam Practice - Luyện thi Actuary hàng đầu Việt Nam",
    description: "Nền tảng luyện thi SOA Actuarial #1 Việt Nam với hàng ngàn câu hỏi, theo dõi tiến độ chi tiết và chế độ thi đấu.",
    creator: '@SOAExamPractice',
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
  icons: {
    icon: '/favicon.ico',
  },
  verification: {
    // Add your verification tokens here when ready
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <StructuredData />
        <AuthProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
