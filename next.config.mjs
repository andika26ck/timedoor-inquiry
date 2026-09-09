/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // sql.js ships an Emscripten/CommonJS WASM loader that must NOT be bundled by
  // webpack (bundling it throws "Cannot set properties of undefined (setting
  // 'exports')"). Externalizing it makes Next require() it at runtime in Node,
  // which is how sql.js is meant to load.
  experimental: {
    serverComponentsExternalPackages: ["sql.js"],
  },
}

export default nextConfig
