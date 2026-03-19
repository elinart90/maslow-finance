/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Disable static export — all pages are dynamic (user-specific data)
  output: undefined,
  // Suppress build errors from missing env vars during static generation
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    // Force all pages to be server-rendered, not statically generated
    missingSuspenseWithCSRBailout: false,
  },
};

export default nextConfig;
