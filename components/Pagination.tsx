import Link from "next/link";

export function Pagination({
  page,
  pageSize,
  total,
  basePath,
  searchParams,
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  searchParams: Record<string, string | undefined>;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  function hrefFor(p: number) {
    const params = new URLSearchParams(
      Object.entries(searchParams).filter(([, v]) => v) as [string, string][]
    );
    params.set("page", String(p));
    return `${basePath}?${params.toString()}`;
  }

  return (
    <div className="mt-12 flex items-center justify-center gap-2">
      <Link
        href={hrefFor(Math.max(1, page - 1))}
        aria-disabled={page <= 1}
        className={`border border-line px-4 py-2 text-xs font-semibold uppercase ${
          page <= 1 ? "pointer-events-none opacity-30" : "hover:border-paper"
        }`}
      >
        Prev
      </Link>
      <span className="px-3 text-xs text-fog">
        Page {page} of {totalPages}
      </span>
      <Link
        href={hrefFor(Math.min(totalPages, page + 1))}
        aria-disabled={page >= totalPages}
        className={`border border-line px-4 py-2 text-xs font-semibold uppercase ${
          page >= totalPages ? "pointer-events-none opacity-30" : "hover:border-paper"
        }`}
      >
        Next
      </Link>
    </div>
  );
}
