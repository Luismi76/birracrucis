import withPWA from "next-pwa";

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "minio.lmsc.es",
      },
    ],
  },
};

// Deshabilitar PWA en Vercel y durante build para evitar problemas de prerendering
const isVercel = !!process.env.VERCEL;
const isProduction = process.env.NODE_ENV === "production";

export default isVercel || isProduction
  ? nextConfig
  : withPWA({
      dest: "public",
      disable: process.env.NODE_ENV === "development",
    })(nextConfig);
