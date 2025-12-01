import withPWA from "next-pwa";

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // lo que ya uses en tu entorno actual
  },
};

export default withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
})(nextConfig);
