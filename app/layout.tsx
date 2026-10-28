import type { Metadata } from 'next';
import './globals.css';
import './brand.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://jiuji-drink-log.imagine-snow.chatgpt.site'),
  title: '酒迹 SipLog｜轻松记录每一次饮酒',
  manifest: '/manifest.webmanifest?v=7',
  icons: { icon: '/brand/app-icon.svg', apple: '/brand/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: '酒迹', statusBarStyle: 'default' },
  description: '像记账一样记录饮酒，用最低的输入成本，看懂自己的饮酒量、花费和长期趋势。',
  openGraph: {
    title: '酒迹 SipLog｜轻松记录每一次饮酒',
    description: '像记账一样记录饮酒，用最低的输入成本，看懂自己的饮酒量、花费和长期趋势。',
    url: 'https://jiuji-drink-log.imagine-snow.chatgpt.site',
    siteName: '酒迹 SipLog',
    locale: 'zh_CN',
    type: 'website',
    images: [{
      url: 'https://jiuji-drink-log.imagine-snow.chatgpt.site/brand/social.png',
      width: 1200,
      height: 630,
      alt: '酒迹——像记账一样记录饮酒',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '酒迹 SipLog｜轻松记录每一次饮酒',
    description: '像记账一样记录饮酒，用最低的输入成本，看懂自己的饮酒量、花费和长期趋势。',
    images: ['https://jiuji-drink-log.imagine-snow.chatgpt.site/brand/social.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <head><meta name="theme-color" content="#743d49" /></head>
      <body>{children}</body>
    </html>
  );
}
