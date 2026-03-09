import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { listProducts, getCategories } from "../services/productService";
import ProductCard from "../components/product/ProductCard";
import cartStore from "../store/cartStore";
import { useToast } from "../components/common/ToastProvider";
import PageContainer from "../components/PageContainer";
import { useTranslation } from "react-i18next";
import styles from "./Products.module.css";

// ─── Skeleton placeholder for product cards ───────────────────────────────────
function ProductSkeleton() {
  return (
    <div className={styles.skeleton} aria-hidden="true">
      <div className={styles.skeletonImg} />
      <div className={styles.skeletonBody}>
        <div className={styles.skeletonLine} style={{ width: "70%" }} />
        <div className={styles.skeletonLine} style={{ width: "40%" }} />
        <div className={styles.skeletonLine} style={{ width: "55%" }} />
      </div>
    </div>
  );
}

// ─── Individual active filter chip ────────────────────────────────────────────
function FilterChip({ label, onRemove }) {
  return (
    <button className={styles.chip} onClick={onRemove} type="button">
      {label}
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </button>
  );
}

// ─── Parse URL search params into filter state ────────────────────────────────
function parseParams(search) {
  const p = new URLSearchParams(search);
  return {
    q: p.get("q") || "",
    category: p.get("category") || "",
    minPrice: p.get("min_price") || "",
    maxPrice: p.get("max_price") || "",
    sortBy: p.get("sort_by") || "newest",
    inStock: p.get("in_stock") === "true" ? true : p.get("in_stock") === "false" ? false : null,
  };
}

// ─── Products page ─────────────────────────────────────────────────────────────
export default function Products() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  // ── Filter state (controlled by URL) ──
  const filters = useMemo(() => parseParams(location.search), [location.search]);

  // ── Local draft state for the filter panel (applied only on submit) ──
  const [draft, setDraft] = useState(filters);

  // ── Mobile filter drawer state ──
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ── Sentinel for IntersectionObserver ──
  const sentinelRef = useRef(null);

  // ── Keep draft in sync with URL on navigation ──
  useEffect(() => {
    setDraft(parseParams(location.search));
  }, [location.search]);

  // ── Fetch categories via React Query (cached 10 min) ──
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 10 * 60 * 1000,
  });

  // ── Infinite query for product listing ──
  const {
    data: productData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: initialLoad,
  } = useInfiniteQuery({
    queryKey: ['products', location.search],
    queryFn: async ({ pageParam = 1 }) => {
      const parsed = parseParams(location.search);
      return listProducts({
        q: parsed.q || undefined,
        category: parsed.category || undefined,
        minPrice: parsed.minPrice !== "" ? parsed.minPrice : null,
        maxPrice: parsed.maxPrice !== "" ? parsed.maxPrice : null,
        sortBy: parsed.sortBy,
        inStock: parsed.inStock,
        page: pageParam,
        pageSize: 20,
      });
    },
    getNextPageParam: (lastPage) => {
      const currentPage = lastPage.page ?? 1;
      const totalPages = lastPage.pages ?? 1;
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    staleTime: 5 * 60 * 1000,
  });

  // ── Flatten pages into a single product array ──
  const products = useMemo(
    () => productData?.pages?.flatMap((p) => p.items ?? []) ?? [],
    [productData]
  );
  const total = productData?.pages?.[0]?.total ?? 0;

  // ── IntersectionObserver for infinite scroll ──
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ── Push filters to URL ──
  function applyFilters(overrides = {}) {
    const merged = { ...draft, ...overrides };
    const p = new URLSearchParams();
    if (merged.q) p.set("q", merged.q);
    if (merged.category) p.set("category", merged.category);
    if (merged.minPrice) p.set("min_price", merged.minPrice);
    if (merged.maxPrice) p.set("max_price", merged.maxPrice);
    if (merged.sortBy && merged.sortBy !== "newest") p.set("sort_by", merged.sortBy);
    if (merged.inStock !== null && merged.inStock !== undefined)
      p.set("in_stock", String(merged.inStock));
    navigate({ pathname: "/products", search: p.toString() });
    setDrawerOpen(false);
  }

  function clearAllFilters() {
    setDraft({ q: "", category: "", minPrice: "", maxPrice: "", sortBy: "newest", inStock: null });
    navigate({ pathname: "/products", search: "" });
    setDrawerOpen(false);
  }

  // ── Compute active filter chips ──
  const activeChips = useMemo(() => {
    const chips = [];
    if (filters.q) chips.push({ key: "q", label: `"${filters.q}"` });
    if (filters.category) chips.push({ key: "category", label: filters.category });
    if (filters.minPrice) chips.push({ key: "minPrice", label: `${t("filter.min_price")}: ${filters.minPrice}` });
    if (filters.maxPrice) chips.push({ key: "maxPrice", label: `${t("filter.max_price")}: ${filters.maxPrice}` });
    if (filters.inStock === true) chips.push({ key: "inStock", label: t("filter.in_stock_only") });
    return chips;
  }, [filters, t]);

  function removeChip(key) {
    const next = { ...draft };
    if (key === "q") next.q = "";
    if (key === "category") next.category = "";
    if (key === "minPrice") next.minPrice = "";
    if (key === "maxPrice") next.maxPrice = "";
    if (key === "inStock") next.inStock = null;
    setDraft(next);
    applyFilters(next);
  }

  const sortOptions = [
    { value: "newest",     label: t("filter.sort_newest") },
    { value: "price_asc",  label: t("filter.sort_price_asc") },
    { value: "price_desc", label: t("filter.sort_price_desc") },
    { value: "popular",    label: t("filter.sort_popular") },
  ];

  // ── Filter panel (shared between sidebar + drawer) ──
  const FilterPanel = () => (
    <div className={styles.filterPanel}>
      <div className={styles.filterSection}>
        <label className={styles.filterLabel}>{t("filter.category")}</label>
        <select
          className={styles.filterSelect}
          value={draft.category}
          onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
        >
          <option value="">{t("filter.all_categories")}</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className={styles.filterSection}>
        <label className={styles.filterLabel}>
          {t("product.price")} ({t("common.currency")})
        </label>
        <div className={styles.priceRow}>
          <input
            type="number"
            min="0"
            placeholder={t("filter.min_price")}
            className={styles.filterInput}
            value={draft.minPrice}
            onChange={(e) => setDraft((d) => ({ ...d, minPrice: e.target.value }))}
          />
          <span className={styles.priceSep}>—</span>
          <input
            type="number"
            min="0"
            placeholder={t("filter.max_price")}
            className={styles.filterInput}
            value={draft.maxPrice}
            onChange={(e) => setDraft((d) => ({ ...d, maxPrice: e.target.value }))}
          />
        </div>
      </div>

      <div className={styles.filterSection}>
        <label className={styles.toggleRow}>
          <input
            type="checkbox"
            className={styles.toggleCheck}
            checked={draft.inStock === true}
            onChange={(e) =>
              setDraft((d) => ({ ...d, inStock: e.target.checked ? true : null }))
            }
          />
          <span>{t("filter.in_stock_only")}</span>
        </label>
      </div>

      <div className={styles.filterActions}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => applyFilters()}
        >
          {t("filter.apply")}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={clearAllFilters}
        >
          {t("filter.clear")}
        </button>
      </div>
    </div>
  );

  return (
    <div className={styles.page}>
      <PageContainer>
        {/* ── Page header ── */}
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>{t("products.browse_title")}</h1>
            {!initialLoad && (
              <p className={styles.pageSubtitle}>
                {total > 0
                  ? t("products.result_count", { count: total })
                  : t("products.no_results")}
              </p>
            )}
          </div>

          <div className={styles.headerActions}>
            {/* Sort dropdown */}
            <select
              className={styles.sortSelect}
              value={filters.sortBy}
              onChange={(e) => applyFilters({ sortBy: e.target.value })}
              aria-label={t("filter.sort_label")}
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Mobile filter trigger */}
            <button
              type="button"
              className={styles.filterToggleBtn}
              onClick={() => setDrawerOpen(true)}
              aria-label={t("filter.open")}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
              </svg>
              {t("filter.filters")}
              {activeChips.length > 0 && (
                <span className={styles.filterBadge}>{activeChips.length}</span>
              )}
            </button>
          </div>
        </div>

        {/* ── Active filter chips ── */}
        {activeChips.length > 0 && (
          <div className={styles.chipsRow} role="list" aria-label={t("filter.active_filters")}>
            {activeChips.map((chip) => (
              <FilterChip
                key={chip.key}
                label={chip.label}
                onRemove={() => removeChip(chip.key)}
              />
            ))}
            <button type="button" className={styles.clearAllBtn} onClick={clearAllFilters}>
              {t("filter.clear_all")}
            </button>
          </div>
        )}

        {/* ── Layout: sidebar + grid ── */}
        <div className={styles.layout}>
          {/* Desktop sidebar */}
          <aside className={styles.sidebar} aria-label={t("filter.filters")}>
            <h3 className={styles.sidebarTitle}>{t("filter.filters")}</h3>
            <FilterPanel />
          </aside>

          {/* Product grid */}
          <main className={styles.gridArea}>
            {initialLoad ? (
              <div className={styles.grid}>
                {Array.from({ length: 12 }).map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon} aria-hidden="true">🔍</div>
                <h2 className={styles.emptyTitle}>{t("products.no_results")}</h2>
                <p className={styles.emptyDesc}>{t("products.no_results_desc")}</p>
                <button type="button" className="btn btn-primary" onClick={clearAllFilters}>
                  {t("filter.clear_all")}
                </button>
              </div>
            ) : (
              <>
                <div className={styles.grid} role="list">
                  {products.map((product) => (
                    <div key={product.id} role="listitem">
                      <ProductCard
                        product={product}
                        onAddToCart={() => {
                          cartStore.addItem(product, 1);
                          toast.push({
                            message: t("product.added_to_cart"),
                            duration: 3500,
                          });
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Infinite scroll sentinel + loading indicator */}
                <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
                {isFetchingNextPage && (
                  <div className={styles.loadingMore}>
                    <div className={styles.spinner} />
                  </div>
                )}
                {!hasNextPage && products.length > 0 && (
                  <p className={styles.endMessage}>{t("products.all_loaded")}</p>
                )}
              </>
            )}
          </main>
        </div>
      </PageContainer>

      {/* ── Mobile filter drawer ── */}
      {drawerOpen && (
        <>
          <div
            className={styles.drawerOverlay}
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside className={styles.drawer} role="dialog" aria-label={t("filter.filters")}>
            <div className={styles.drawerHeader}>
              <h3 className={styles.sidebarTitle}>{t("filter.filters")}</h3>
              <button
                type="button"
                className={styles.drawerClose}
                onClick={() => setDrawerOpen(false)}
                aria-label={t("common.close")}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <FilterPanel />
          </aside>
        </>
      )}
    </div>
  );
}
