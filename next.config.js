/** @type {import('next').NextConfig} */

const nextConfig = {
  output: "export",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
  reactStrictMode: true, // Enable React strict mode for improved error handling
  swcMinify: true, // Enable SWC minification for improved performance
  compiler: {
    removeConsole: process.env.NODE_ENV !== "development", // Remove console.log in production
  },
  env: {
    BUILD_ID: new Date().toISOString(), // Later it would be worth setting up the git's commit hash as the build id
  },
};

// Configuration object tells the next-pwa plugin
const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public", // Destination directory for the PWA files
  disable: process.env.NODE_ENV === "development", // Disable PWA in development mode
  register: true, // Register the PWA service worker
  skipWaiting: true, // Skip waiting for service worker activation
});

module.exports = withPWA(nextConfig);
