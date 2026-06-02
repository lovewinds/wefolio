import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';

const pretendard = localFont({
  variable: '--font-pretendard',
  display: 'swap',
  src: [
    { path: './fonts/Pretendard-Thin.otf', weight: '100', style: 'normal' },
    { path: './fonts/Pretendard-ExtraLight.otf', weight: '200', style: 'normal' },
    { path: './fonts/Pretendard-Light.otf', weight: '300', style: 'normal' },
    { path: './fonts/Pretendard-Regular.otf', weight: '400', style: 'normal' },
    { path: './fonts/Pretendard-Medium.otf', weight: '500', style: 'normal' },
    { path: './fonts/Pretendard-SemiBold.otf', weight: '600', style: 'normal' },
    { path: './fonts/Pretendard-Bold.otf', weight: '700', style: 'normal' },
    { path: './fonts/Pretendard-ExtraBold.otf', weight: '800', style: 'normal' },
    { path: './fonts/Pretendard-Black.otf', weight: '900', style: 'normal' },
  ],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'WeFolio',
  description: '가족의 자산 포트폴리오를 완성해 나가는 가계부',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const themeScript = `
    (function() {
      const stored = localStorage.getItem('theme');
      if (stored === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (stored === 'light') {
        document.documentElement.classList.add('light');
      }
    })();
  `;

  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        suppressHydrationWarning
        className={`${pretendard.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
