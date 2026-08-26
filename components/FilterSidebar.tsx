"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { Brand } from "@/lib/types";
import clsx from "clsx";

export function FilterSidebar({
  brands,
  showGenderFilter = true,
}: {
  brands: Brand[];
  showGenderFilter?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeBrand = searchParams.get("brand");
  const activeGender = searchParams.get("gender");

  function update(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <aside className="space-y-8">
      <div>
        <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-fog">Brand</h4>
        <div className="flex flex-col gap-1.5">
          <FilterButton active={!activeBrand} onClick={() => update("brand", null)}>
            All Brands
          </FilterButton>
          {brands.map((b) => (
            <FilterButton key={b.slug} active={activeBrand === b.slug} onClick={() => update("brand", b.slug)}>
              {b.name}
            </FilterButton>
          ))}
        </div>
      </div>

      {showGenderFilter && (
        <div>
          <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-fog">Gender</h4>
          <div className="flex flex-col gap-1.5">
            <FilterButton active={!activeGender} onClick={() => update("gender", null)}>
              All
            </FilterButton>
            {["MEN", "WOMEN", "UNISEX"].map((g) => (
              <FilterButton key={g} active={activeGender === g} onClick={() => update("gender", g)}>
                {g.charAt(0) + g.slice(1).toLowerCase()}
              </FilterButton>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "rounded-sm px-3 py-2 text-left text-[13px] transition-colors",
        active ? "bg-paper/10 font-semibold text-paper" : "text-fog hover:text-paper"
      )}
    >
      {children}
    </button>
  );
}
