/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Keep Prisma out of the bundler; let file tracing ship its engine instead.
    serverComponentsExternalPackages: ["@prisma/client", "prisma"],
    // Make sure the seeded SQLite snapshot and the Prisma query engine are
    // included in every serverless function bundle on Vercel.
    outputFileTracingIncludes: {
      "/**": [
        "./prisma/prod-seed.db",
        "./node_modules/.prisma/client/libquery_engine-*",
      ],
    },
  },
};

export default nextConfig;
