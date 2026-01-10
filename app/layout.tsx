import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './globals.css';
import { AuthProvider } from './contexts/AuthContext';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'Haudit - Music Royalty Auditing Platform',
    template: '%s | Haudit',
  },
  description: 'Monitor your music performance, track royalty earnings, manage advances and expenses. Comprehensive music royalty auditing for artists and labels.',
  keywords: ['music royalties', 'royalty tracking', 'music analytics', 'streaming revenue', 'artist dashboard', 'music advances', 'DSP analytics', 'music expenses'],
  authors: [{ name: 'Haudit' }],
  creator: 'Haudit',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://haudit.com',
    title: 'Haudit - Music Royalty Auditing Platform',
    description: 'Monitor your music performance, track royalty earnings, manage advances and expenses.',
    siteName: 'Haudit',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Haudit - Music Royalty Auditing Platform',
    description: 'Monitor your music performance, track royalty earnings, manage advances and expenses.',
    creator: '@haudit',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </body>
    </html>
  );
}
