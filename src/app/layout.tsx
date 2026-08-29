import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rudi & Gabriella — Wedding Invitation",
  description:
    "We invite you to celebrate the wedding of Rudi Sukarto and Gabriella Dharmawan.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cormorant.variable + " " + dmSans.variable}>
      <body>{children}</body>
    </html>
  );
}
