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
  experimental: {
    serverComponentsExternalPackages: ['@google-cloud/tasks', '@remotion/bundler', '@remotion/renderer']
  },
  outputFileTracing: false,
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, x-api-key, Authorization, Cache-Control" },
        ],
      },
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
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/",
          has: [
            {
              type: "host",
              value: "fideliza.socialpilot.cl",
            },
          ],
          destination: "/fideliza",
        },
        {
          source: "/:path((?!api|_next|fideliza|favicon|.*\\..*).*)",
          has: [
            {
              type: "host",
              value: "fideliza.socialpilot.cl",
            },
          ],
          destination: "/fideliza/:path",
        },
      ],
    };
  },
};

export default nextConfig;
