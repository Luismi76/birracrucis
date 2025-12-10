import type { Metadata } from "next";
import "./globals.css";
import AppWrapper from "@/components/AppWrapper";
import AuthProvider from "@/components/AuthProvider";
import { Toaster } from "sonner";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "Birracrucis - Planifica tu ruta de bares",
  description: "Planifica la ruta de bares perfecta con tus amigos. Organiza quedadas, sigue el progreso en tiempo real y comparte fotos de la noche.",
  keywords: ["ruta de bares", "quedadas", "amigos", "cerveza", "tapas", "planificador", "app"],
  authors: [{ name: "Birracrucis" }],
  creator: "Birracrucis",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  // Open Graph - Para compartir en redes sociales
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://birracrucis.com",
    siteName: "Birracrucis",
    title: "Birracrucis - Planifica tu ruta de bares",
    description: "Planifica la ruta de bares perfecta con tus amigos. Organiza quedadas, sigue el progreso en tiempo real y comparte fotos de la noche.",
    images: [
      {
        url: "/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "Birracrucis Logo",
      },
    ],
  },
  // Twitter Card
  twitter: {
    card: "summary",
    title: "Birracrucis - Planifica tu ruta de bares",
    description: "Planifica la ruta de bares perfecta con tus amigos.",
    images: ["/android-chrome-512x512.png"],
  },
  // Otros metadatos
  applicationName: "Birracrucis",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Birracrucis",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <meta name="theme-color" content="#f59e0b" />
        {/* Viewport optimizado para movil */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no" />
      </head>
      <body
        className="antialiased min-h-screen-safe"
      >
        <AuthProvider>
          <AppWrapper>{children}</AppWrapper>
          <Toaster richColors position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}
