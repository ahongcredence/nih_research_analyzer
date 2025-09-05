import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header, Footer } from "./components";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Research Analyzer",
  description: "Advanced research analysis and data processing platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen flex flex-col">
          <Header
            logo={{
              src: "/nih_logo.png",
              alt: "Research Analyzer Logo",
              width: 50,
              height: 50,
            }}
            heading="Agentic Research Analysis"
            subheading="Advanced Data Analysis Platform"
            navigation={[
              { label: "Home", href: "/" },
              { label: "Analysis", href: "/analysis" },
            ]}
          />
          <main className="flex-1">
            {children}
          </main>
          <Footer
            agencyName="Credence"
            agencyDescription="Empowering researchers with advanced data analysis tools and insights to accelerate scientific discovery and innovation."
            links={[
              { label: "Home", href: "/" },
              { label: "Analysis Tools", href: "/analysis" },
              { label: "Documentation", href: "/docs" },
              { label: "API Reference", href: "/api-docs" },
              { label: "Support", href: "/support" },
            ]}
            contactInfo={{
              address: "1775 Tysons Blvd Suite 800, McLean, VA 22102",
              phone: "(888) 459-2430",
              email: "credence@credence-llc.com",
            }}
          />
        </div>
      </body>
    </html>
  );
}
