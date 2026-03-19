import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Maslow Finance — Life Savings System",
  description:
    "A complete personal finance tracker built on Maslow's hierarchy of needs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex h-screen overflow-hidden bg-[#F9F9F7]">
        <Sidebar />
        <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
          <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-8">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
