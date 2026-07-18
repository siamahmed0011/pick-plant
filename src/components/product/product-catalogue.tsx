"use client";
import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Grid2X2, List, Search, SlidersHorizontal } from "lucide-react";
import {
  ProductFilters,
  emptyFilters,
  type ShopFilters,
} from "@/components/product/product-filters";
import { ProductGrid } from "@/components/product/product-grid";
import { ProductList } from "@/components/product/product-list";
import { Container } from "@/components/shared/container";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { EmptyState } from "@/components/shared/empty-state";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types";

type View = "grid" | "list";

function listParam(params: Pick<URLSearchParams, "get">, name: string) {
  return params.get(name)?.split(",").filter(Boolean) ?? [];
}

export function ProductCatalogue({ products }: { products: Product[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const filters = useMemo<ShopFilters>(
    () => ({
      ...emptyFilters,
      categories: listParam(params, "category")
        .map((slug) => products.find((product) => product.category.slug === slug)?.category.name)
        .filter((name): name is string => Boolean(name)),
      light: listParam(params, "light"),
      water: listParam(params, "water"),
      difficulty: listParam(params, "difficulty"),
      petFriendly: listParam(params, "petFriendly"),
      availability: listParam(params, "availability"),
      price: params.get("maxPrice") ?? "",
    }),
    [params, products]
  );
  const query = params.get("search") ?? "";
  const sort = params.get("sort") ?? "newest";
  const view: View = params.get("view") === "list" ? "list" : "grid";
  const [mobileFilters, setMobileFilters] = useState(false);
  const categoryOptions = useMemo(
    () => Array.from(new Set(products.map((product) => product.category.name))).sort(),
    [products],
  );
  const syncUrl = (changes: {
    filters?: ShopFilters;
    query?: string;
    sort?: string;
    view?: View;
  }) => {
    const nextFilters = changes.filters ?? filters;
    const nextQuery = changes.query ?? query;
    const nextSort = changes.sort ?? sort;
    const nextView = changes.view ?? view;
    const next = new URLSearchParams();
    if (nextQuery) next.set("search", nextQuery);
    if (nextFilters.categories.length)
      next.set(
        "category",
        nextFilters.categories
          .map((name) => products.find((product) => product.category.name === name)?.category.slug)
          .filter(Boolean)
          .join(",")
      );
    if (nextFilters.light.length) next.set("light", nextFilters.light.join(","));
    if (nextFilters.water.length) next.set("water", nextFilters.water.join(","));
    if (nextFilters.difficulty.length) next.set("difficulty", nextFilters.difficulty.join(","));
    if (nextFilters.petFriendly.length) next.set("petFriendly", nextFilters.petFriendly.join(","));
    if (nextFilters.availability.length)
      next.set("availability", nextFilters.availability.join(","));
    if (nextFilters.price) next.set("maxPrice", nextFilters.price);
    if (nextSort !== "newest") next.set("sort", nextSort);
    if (nextView !== "grid") next.set("view", nextView);
    next.set("page", "1");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };
  const setFilters = (value: ShopFilters) => syncUrl({ filters: value });
  const setQuery = (value: string) => syncUrl({ query: value });
  const setSort = (value: string) => syncUrl({ sort: value });
  const setView = (value: View) => syncUrl({ view: value });
  const visibleProducts = useMemo(() => {
    const result = products.filter((product) => {
      const text = `${product.name} ${product.bengaliName}`.toLowerCase();
      const categoryOk =
        !filters.categories.length || filters.categories.includes(product.category.name);
      const lightOk =
        !filters.light.length ||
        filters.light.some((item) =>
          product.lightRequirement.toLowerCase().includes(item.split(" ")[0].toLowerCase())
        );
      const difficultyOk =
        !filters.difficulty.length ||
        filters.difficulty.includes(product.difficulty) ||
        (filters.difficulty.includes("Advanced") && product.difficulty === "Hard");
      const availabilityOk =
        !filters.availability.length ||
        filters.availability.some((item) =>
          item === "In Stock" ? product.stock > 0 : product.stock === 0
        );
      const priceOk = !filters.price || product.regularPrice <= Number(filters.price);
      return (
        categoryOk &&
        lightOk &&
        difficultyOk &&
        availabilityOk &&
        priceOk &&
        text.includes(query.toLowerCase())
      );
    });
    return [...result].sort((a, b) =>
      sort === "price-low"
        ? a.regularPrice - b.regularPrice
        : sort === "price-high"
          ? b.regularPrice - a.regularPrice
          : sort === "alphabetical"
            ? a.name.localeCompare(b.name)
            : 0
    );
  }, [filters, products, query, sort]);
  const reset = () => syncUrl({ filters: emptyFilters, query: "", sort: "newest", view: "grid" });
  return (
    <main className="py-8 sm:py-12">
      <Container>
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "All Plants" }]} />
        <header className="mt-6 flex flex-col justify-between gap-4 border-b pb-8 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.18em] text-[var(--primary)]">
              Shop Pick Plant
            </p>
            <h1 className="mt-2 text-3xl font-bold sm:text-5xl">All Plants</h1>
            <p className="mt-3 max-w-2xl text-lg leading-7 text-[var(--muted)]">
              {"বাংলাদেশের ঘর, বারান্দা, অফিস এবং বাগানের জন্য নির্বাচিত গাছ।"}
            </p>
          </div>
          <p className="text-sm text-[var(--muted)]">
            <strong className="text-[var(--text)]">{visibleProducts.length}</strong> of{" "}
            {products.length} plants
          </p>
        </header>
        <div className="mt-8 flex flex-col gap-4 lg:grid lg:grid-cols-[18rem_1fr]">
          <div className="hidden lg:block">
            <ProductFilters categories={categoryOptions} value={filters} onChange={setFilters} onReset={reset} />
          </div>
          <section aria-label="Plant catalogue" className="min-w-0">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <label className="relative min-w-[14rem] flex-1">
                <span className="sr-only">Search plants</span>
                <Search className="absolute left-3 top-3 text-[var(--muted)]" size={18} />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="pl-10"
                  type="search"
                  placeholder="Search plants..."
                />
              </label>
              <select
                aria-label="Sort plants"
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="h-11 rounded-xl border bg-white px-3"
              >
                <option value="newest">Newest</option>
                <option value="popular">Popular</option>
                <option value="price-low">Price Low to High</option>
                <option value="price-high">Price High to Low</option>
                <option value="alphabetical">Alphabetical</option>
                <option value="rated">Highest Rated</option>
              </select>
              <div className="hidden rounded-xl border p-1 sm:flex">
                <button
                  type="button"
                  aria-label="Grid view"
                  aria-pressed={view === "grid"}
                  onClick={() => setView("grid")}
                  className={`grid size-9 place-items-center rounded-lg ${view === "grid" ? "bg-[var(--primary)] text-white" : ""}`}
                >
                  <Grid2X2 size={17} />
                </button>
                <button
                  type="button"
                  aria-label="List view"
                  aria-pressed={view === "list"}
                  onClick={() => setView("list")}
                  className={`grid size-9 place-items-center rounded-lg ${view === "list" ? "bg-[var(--primary)] text-white" : ""}`}
                >
                  <List size={17} />
                </button>
              </div>
              <Button
                variant="outline"
                className="lg:hidden"
                onClick={() => setMobileFilters(true)}
              >
                <SlidersHorizontal size={17} />
                Filters
              </Button>
            </div>
            {visibleProducts.length ? (
              view === "grid" ? (
                <ProductGrid items={visibleProducts} />
              ) : (
                <ProductList items={visibleProducts} />
              )
            ) : (
              <EmptyState
                title="No plants found"
                description="আপনার নির্বাচিত filter বা search পরিবর্তন করে আবার চেষ্টা করুন।"
              />
            )}
            <div className="mt-8 flex items-center justify-between border-t pt-5">
              <span className="text-sm text-[var(--muted)]">Page 1 of 1</span>
              <nav aria-label="Pagination" className="flex gap-2">
                <Button size="sm" variant="outline" disabled>
                  Previous
                </Button>
                <Button size="sm" aria-current="page">
                  1
                </Button>
                <Button size="sm" variant="outline" disabled>
                  Next
                </Button>
              </nav>
            </div>
          </section>
        </div>
      </Container>
      <Drawer open={mobileFilters} title="Filters" onClose={() => setMobileFilters(false)}>
        <ProductFilters
          categories={categoryOptions}
          value={filters}
          onChange={setFilters}
          onReset={() => {
            reset();
            setMobileFilters(false);
          }}
        />
      </Drawer>
    </main>
  );
}
