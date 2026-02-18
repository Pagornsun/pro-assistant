import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kinn - Personal Executive Assistant",
  description: "Your Personal Executive Assistant in LINE. Professional support, just one message away.",
};

import { LiffProvider } from "@/components/providers/LiffProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/ui/States";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`${manrope.variable} antialiased font-manrope`}
      >
        <ErrorBoundary>
          <OfflineBanner />
          <LiffProvider>
            {children}
          </LiffProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

