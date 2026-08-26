/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Only allow-list image hosts we have verified usage rights for.
    // Master catalog images are NOT listed here on purpose — they are
    // usage_status = REFERENCE_ONLY / storefront_approved = false in the
    // database, so the app renders a generated placeholder for them instead
    // of ever requesting them. See lib/utils/media.ts.
    remotePatterns: [
      {
        // Matterhorn supplier feed — shoe_supplier_product_images.usage_scope
        // = 'PUBLIC_SUPPLIER_FEED'. Served over plain HTTP by the supplier;
        // Next/Image will proxy/optimize server-side so this does not create
        // mixed-content issues in the browser, but flag this to your infra/
        // security review before going beyond POC.
        protocol: "http",
        hostname: "srv0.matterhorn-wholesale.com",
        pathname: "/**",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
