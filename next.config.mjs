/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Rewrites named imports to per-icon paths at build time, so the
    // whole icon library never enters the bundle.
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
