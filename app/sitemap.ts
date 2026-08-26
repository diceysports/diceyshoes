import type { MetadataRoute } from "next";
import { getBrands } from "@/lib/data/brands";
import { getProducts } from "@/lib/data/products";

const BASE_URL = "https://diceyshoes.example.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [brands, { products }] = await Promise.all([
    getBrands(),
    getProducts({ pageSize: 60, sort: "popular" }),
  ]);

  const staticRoutes = [
    "",
    "/shop",
    "/new-releases",
    "/men",
    "/women",
    "/sneakers",
    "/luxury",
    "/brands",
    "/releases",
    "/news",
  ].map((path) => ({ url: `${BASE_URL}${path}`, changeFrequency: "daily" as const }));

  const brandRoutes = brands.map((b) => ({
    url: `${BASE_URL}/brands/${b.slug}`,
    changeFrequency: "daily" as const,
  }));

  const productRoutes = products.map((p) => ({
    url: `${BASE_URL}/product/${p.slug}`,
    changeFrequency: "weekly" as const,
  }));

  return [...staticRoutes, ...brandRoutes, ...productRoutes];
}
