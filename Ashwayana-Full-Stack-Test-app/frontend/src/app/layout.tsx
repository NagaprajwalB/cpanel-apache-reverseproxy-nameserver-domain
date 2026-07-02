import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import * as fs from "fs";
import * as path from "path";

const inter = Inter({ subsets: ["latin"] });

// Copy logo image from brain dir to public dir at server-side runtime
try {
  const src = "C:/Users/DELL-5560/.gemini/antigravity-ide/brain/20f3bd07-2d80-470a-96e7-6efd817c7310/media__1782278475639.png";
  const dest = path.join(process.cwd(), "public", "logo.png");
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
} catch (error) {
  console.error("Failed to copy logo image in layout.tsx:", error);
}

export const metadata: Metadata = {
  title: "Ashvayana Admin Panel",
  description: "Enterprise Real Estate CRM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
