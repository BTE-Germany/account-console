import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import AuthProvider from "@/components/common/AuthProvider";
import { getSession } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";
import NextTopLoader from 'nextjs-toploader';
import Footer from "@/components/common/Footer";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});
export const metadata: Metadata = {
  title: "Account Console | BTE Germany",
  description: "Verwalte deine Kontoeinstellungen und Präferenzen bei BTE Germany.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const session = await getSession();

  return (
    <html lang="en">
      <body
        className={`${outfit.className} antialiased dark`}
      >
        <AuthProvider session={session}>
          <NextTopLoader color={"var(--color-primary)"} />
          <div className={"min-h-screen flex flex-col"}>
            <Navbar />
            <div className="flex-1 h-full w-full ">
              {children}
            </div>
            <Footer />
          </div>

          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
