/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Na maszynach z małą ilością RAM ogranicz liczbę workerów buildu (patrz: npm run build:local)
  ...(process.env.NEXT_BUILD_CPUS
    ? { experimental: { cpus: Number(process.env.NEXT_BUILD_CPUS) } }
    : {})
};

module.exports = nextConfig;
