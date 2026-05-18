import type { Metadata, Viewport } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/contexts/ToastContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Lectio AI - Aqlli Ta'lim", template: "%s | Lectio AI" },
  description:
    "O'zbekiston universitetlari uchun AI-asosidagi ta'lim platformasi. Metodichka, dars va testlar - hammasi AI bilan.",
  keywords: ["ta'lim", "AI", "quiz", "universitet", "O'zbekiston", "Lectio", "online dars"],
  authors: [{ name: "Lectio AI Team" }],
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },  // Primary — modern browsers
      { url: "/logo.svg", type: "image/svg+xml" },  // Fallback SVG
      { url: "/favicon.ico", sizes: "any" },         // Legacy fallback
    ],
    shortcut: "/icon.svg",
    apple:    "/icon.svg",
  },
  openGraph: {
    title: "Lectio AI",
    description: "O'zbekiston universitetlari uchun AI ta'lim platformasi",
    type: "website",
    locale: "uz_UZ",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5A623" },
    { media: "(prefers-color-scheme: dark)",  color: "#0A0A0F"  },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  var t = localStorage.getItem('lectio-theme') || 'dark';
                  var r = t === 'system'
                    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                    : t;
                  document.documentElement.classList.add(r);
                } catch(e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={`${dmSans.variable} ${jetbrainsMono.variable} font-body antialiased`}>
        <ThemeProvider defaultTheme="dark">
          <LanguageProvider defaultLanguage="uz">
            <ToastProvider>{children}</ToastProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
