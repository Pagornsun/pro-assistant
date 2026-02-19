import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "react-hot-toast";
import { Manrope } from "next/font/google";
import "./globals.css";
import { Providers } from "../components/providers/Providers";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "Kinn - Pro Assistant",
  description: "AI-Powered Personal Assistant for Professionals",
};

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
        <Providers>
          {children}
          <Analytics />
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                background: '#333',
                color: '#fff',
                borderRadius: '12px',
              },
              success: {
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
