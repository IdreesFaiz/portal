import type { Metadata } from "next";
import { Noto_Nastaliq_Urdu } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const urduFont = Noto_Nastaliq_Urdu({
  variable: "--font-urdu",
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "اسکول ایڈمن ڈیش بورڈ",
  description: "اسکول مینجمنٹ سسٹم — طلباء، جماعتیں، مضامین اور نمبرات کا انتظام",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ur" dir="rtl" className={`${urduFont.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[var(--font-urdu)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
