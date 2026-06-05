import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '../contexts/ToastContext';
import { ToastContainer } from '../components/ToastContainer';
import { AuthProvider } from '../contexts/AuthContext';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'CourseForge',
  description: 'Launch your new career',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ToastProvider>
          <AuthProvider>
            {children}
            <ToastContainer />
          </AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
