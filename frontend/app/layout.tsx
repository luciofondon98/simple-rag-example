import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simple RAG - Next.js",
  description: "Chat with your PDFs powered by AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
