import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@/lib/data/search";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  try {
    const results = await searchProducts(q);
    return NextResponse.json({ results });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ results: [], error: "search_failed" }, { status: 500 });
  }
}
