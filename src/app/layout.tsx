import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});



export const metadata: Metadata = {
  metadataBase: new URL("https://www.bestteknikbogor.com"),

  title: "BEST Teknik Bogor | Jasa Servis AC",
  description:
    "BEST Teknik melayani jasa servis, cuci, dan perawatan AC panggilan di Bogor. Hubungi kami untuk informasi layanan dan booking servis.",

  alternates: {
    canonical: "/",
  },

  robots: {
    index: true,
    follow: true,
  },

  openGraph: {
    title: "BEST Teknik Bogor | Jasa Servis AC",
    description:
      "Jasa servis dan perawatan AC panggilan di Bogor oleh BEST Teknik.",
    url: "https://www.bestteknikbogor.com/",
    siteName: "BEST Teknik",
    locale: "id_ID",
    type: "website",
  },
};



export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
