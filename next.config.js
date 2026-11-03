/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Polski jest domyślny (bez prefiksu), angielski pod /en. Bez automatycznego wykrywania języka przeglądarki,
  // żeby adres zawsze dawał tę samą treść (ważne dla wyszukiwarek i udostępniania).
  i18n: {
    locales: ['pl', 'en'],
    defaultLocale: 'pl',
    localeDetection: false
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  // Na maszynach z małą ilością RAM ogranicz liczbę workerów buildu (patrz: npm run build:local)
  ...(process.env.NEXT_BUILD_CPUS
    ? { experimental: { cpus: Number(process.env.NEXT_BUILD_CPUS) } }
    : {})
};

module.exports = nextConfig;
