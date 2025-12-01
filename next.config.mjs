import withPWA from "next-pwa";

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

// Deshabilitar PWA en Vercel para evitar que el service worker intercepte las API routes
const isVercel = !!process.env.VERCEL;

export default isVercel
  ? nextConfig
  : withPWA({
      dest: "public",
      disable: process.env.NODE_ENV === "development",
    })(nextConfig);
