import type { Metadata } from 'next';
import { Inter, Roboto } from 'next/font/google';
import './globals.css';
import { cn } from "@/lib/utils";
import NextTopLoader from 'nextjs-toploader';
import { Toaster } from '@/components/ui/sonner';

const roboto = Roboto({ subsets: ['latin'], variable: '--font-sans' });
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'QuickDesk - AI-Assisted Helpdesk',
  description: 'Internal helpdesk app that uses an LLM to assist support agents',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("dark", "font-sans", roboto.variable)}>
      <body className={`${inter.className} bg-slate-950 text-slate-100 min-h-screen antialiased selection:bg-indigo-500 selection:text-white`}>
        <NextTopLoader
          color="var(--primary)"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          easing="ease"
          showSpinner={false}
          speed={200}
        />
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
