/** @type {import('next').NextConfig} */
const allowedOrigins = ['localhost:3000'];

if (process.env.RAILWAY_PUBLIC_DOMAIN) {
  allowedOrigins.push(process.env.RAILWAY_PUBLIC_DOMAIN);
}
if (process.env.NEXTAUTH_URL) {
  const host = process.env.NEXTAUTH_URL.replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (!allowedOrigins.includes(host)) allowedOrigins.push(host);
}

const nextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins,
    },
  },
};

module.exports = nextConfig;
