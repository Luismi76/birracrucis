import withPWA from "next-pwa";

const nextConfig = {
  reactStrictMode: true,
  // Silenciar error de Turbopack con config de webpack (next-pwa usa webpack)
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
})(nextConfig);
