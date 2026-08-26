import type { MasterProduct } from "@/lib/types";
import { ProductCard } from "./ProductCard";

export function ProductGrid({
  products,
  emptyMessage = "No products match these filters yet.",
}: {
  products: MasterProduct[];
  emptyMessage?: string;
}) {
  if (products.length === 0) {
    return (
      <div className="rounded border border-dashed border-line py-20 text-center text-sm text-fog">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.productId} product={p} />
      ))}
    </div>
  );
}
