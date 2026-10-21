import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'BBAM Packing Challenge｜出貨大挑戰', description: 'BBAM 營運助理出貨模擬測驗', robots: { index: false, follow: false }, icons: { icon: '/favicon.svg' } };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#f5f3ee' };
export default function Layout({ children }: { children: React.ReactNode }) { return <html lang="zh-Hant"><body>{children}</body></html>; }
