'use client';

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import Header from "@/components/Header";
import SidebarSimple from "@/components/SidebarSimple";
import { SidebarProvider } from "@/lib/contexts/SidebarContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Hide sidebar on authentication pages
  const isAuthPage = pathname?.startsWith('/sign-in') || pathname?.startsWith('/sign-up');

  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <SidebarProvider>
            {!isAuthPage && <Header onMenuClick={() => setIsMobileSidebarOpen(true)} />}

            {/* Backdrop for mobile */}
            {!isAuthPage && isMobileSidebarOpen && (
              <div
                className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={() => setIsMobileSidebarOpen(false)}
              />
            )}

            {/* Sidebar */}
            {!isAuthPage && (
              <SidebarSimple
                isOpen={isMobileSidebarOpen}
                onClose={() => setIsMobileSidebarOpen(false)}
              />
            )}

            {children}
          </SidebarProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
