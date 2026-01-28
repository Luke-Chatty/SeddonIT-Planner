/** @type {import('next').NextConfig} */
const nextConfig = {
  sassOptions: {
    silenceDeprecations: ['legacy-js-api'],
  },
  output: "standalone",
};

export default nextConfig;