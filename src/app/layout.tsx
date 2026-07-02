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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = localStorage.getItem('theme') || 'light';
                document.documentElement.setAttribute('data-theme', theme);
                document.documentElement.style.colorScheme = theme;
              })();
            `
          }}
        />
      </head>
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
