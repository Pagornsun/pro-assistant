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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${manrope.variable} antialiased font-manrope`}
      >
        <LiffProvider>
          {children}
        </LiffProvider>
      </body>
    </html>
  );
}
