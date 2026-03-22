import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider, RealtimeCacheInvalidator } from "@/lib/react-query";
import { AuthProvider } from "@/lib/authContext";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HierInfo - News That Respects Your Time",
  description: "No duplicates, no clickbait, no information overload. Just the news that matters to you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <QueryProvider>
          <AuthProvider>
            <RealtimeCacheInvalidator />
            {children}
          </AuthProvider>
        </QueryProvider>
        <Toaster 
          position="top-right" 
          richColors 
          closeButton
          theme="dark"
          toastOptions={{
            style: {
              background: 'rgba(14, 23, 45, 0.96)',
              border: '1px solid rgba(124, 92, 255, 0.35)',
              color: '#e8efff',
            },
          }}
        />
      </body>
    </html>
  );
}
