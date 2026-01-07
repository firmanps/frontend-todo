import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import { CsrfTokenProvider } from "@/components/CsrfTokenProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";

const font = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "TaskFlow",
  description: "Task management app for better productivity",
  icons: "./icon2.png",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${font.variable} antialiased font-sans `}>
        <CsrfTokenProvider>
          <AuthProvider>
            <main>{children}</main>
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </CsrfTokenProvider>
      </body>
    </html>
  );
}
