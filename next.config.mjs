/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  typedRoutes: true,
  // better-sqlite3 ships a native addon (.node binary) that must not be bundled
  // by the server compiler — we require it at runtime from node_modules instead.
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
