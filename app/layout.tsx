import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'Tile Warehouse Inventory & Locator System',
  description: 'Warehouse tile inventory and location management system.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Tile Warehouse',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row antialiased">
        <Navbar />
        <main className="flex-1 md:ml-64 pb-20 md:pb-8 pt-4 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto w-full min-h-screen">
          {children}
        </main>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
