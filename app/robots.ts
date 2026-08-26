import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // Disallow everything while this is a proof of concept pointed at
      // production data. Flip to allow: "/" once ready to go live and
      // remove the `robots: { index: false }` in app/layout.tsx metadata.
      disallow: "/",
    },
  };
}
