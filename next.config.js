/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // The book detail view now lives on /dashboard?book=<id>; the standalone
      // /book/[id] route no longer exists. Keep old links/bookmarks working.
      { source: "/book/:id", destination: "/dashboard?book=:id", permanent: false },
    ];
  },
};
module.exports = nextConfig;
