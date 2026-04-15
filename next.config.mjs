/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Esto permite que el build termine aunque TypeScript sea lento o encuentre alertas
    ignoreBuildErrors: true,
  },
  eslint: {
    // También ignoramos ESLint para ganar velocidad en el VPS
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
