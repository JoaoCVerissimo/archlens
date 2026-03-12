/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@archlens/shared"],
};

module.exports = nextConfig;
