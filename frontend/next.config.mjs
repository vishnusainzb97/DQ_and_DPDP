/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Required because the repo name is DQ_and_DPDP
  basePath: '/DQ_and_DPDP',
  // Disable image optimization because GitHub Pages doesn't support Next.js Image Optimization
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
