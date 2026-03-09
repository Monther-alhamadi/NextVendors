import api from "./api";

/**
 * Fetch a paginated, filtered, sorted list of published products.
 * @returns {{ items: Product[], total: number, page: number, pages: number }}
 */
export async function listProducts({
  q = "",
  category = null,
  minPrice = null,
  maxPrice = null,
  sortBy = "newest",
  inStock = null,
  supplierId = null,
  page = 1,
  pageSize = 20,
} = {}) {
  const params = { page, page_size: pageSize, sort_by: sortBy };
  if (q) params.q = q;
  if (category) params.category = category;
  if (minPrice !== null && minPrice !== "") params.min_price = minPrice;
  if (maxPrice !== null && maxPrice !== "") params.max_price = maxPrice;
  if (inStock !== null) params.in_stock = inStock;
  if (supplierId) params.supplier_id = supplierId;
  const resp = await api.get("/products/", { params });
  return resp.data; // { items, total, page, pages }
}

/**
 * Fetch distinct categories that have at least one published product.
 * @returns {string[]}
 */
export async function getCategories() {
  const resp = await api.get("/products/categories");
  return resp.data;
}

/**
 * Fetch a small curated set of featured products for the Landing page.
 * Uses the same endpoint but limits to 8 items, sorted by popularity.
 */
export async function listFeaturedProducts(limit = 8) {
  const resp = await api.get("/products/", {
    params: { sort_by: "popular", page_size: limit, page: 1 },
  });
  // Unwrap the items array from the paginated envelope
  const data = resp.data;
  return Array.isArray(data) ? data : (data.items ?? []);
}


export async function getProduct(id) {
  const resp = await api.get(`/products/${id}`);
  return resp.data;
}

export async function createProduct(payload) {
  const resp = await api.post(`/products/`, payload);
  return resp.data;
}

export async function updateProduct(id, payload) {
  const resp = await api.put(`/products/${id}`, payload);
  return resp.data;
}

export async function deleteProduct(id) {
  const resp = await api.delete(`/products/${id}`);
  return resp.data;
}

export async function getProductVariationVariables(productId) {
  const resp = await api.get(`/products/${productId}/variation_variables`);
  return resp.data;
}

export async function createVariationVariable(productId, payload) {
  const resp = await api.post(
    `/products/${productId}/variation_variables`,
    payload
  );
  return resp.data;
}

export async function createVariationValue(variableId, payload) {
  const resp = await api.post(
    `/products/variation_variables/${variableId}/values`,
    payload
  );
  return resp.data;
}

export async function setVariationResult(productId, payload) {
  const resp = await api.post(
    `/products/${productId}/variation_results`,
    payload
  );
  return resp.data;
}

// Module 2: Hybrid & Moderation
export async function createVendorListing(masterId, overrides = {}) {
  // Post to a specific endpoint or generic product create with master_id
  const resp = await api.post("/products/vendor-listing", { master_id: masterId, overrides });
  return resp.data;
}

export async function adminGetPendingProducts(params = {}) {
    const resp = await api.get("/admin/moderation/pending", { params });
    return resp.data;
}

export async function adminReviewProduct(productId, status, reason = null) {
    const resp = await api.post(`/admin/moderation/${productId}/review`, { status, reason });
    return resp.data;
}

export async function resolveVariation(productId, mapping) {
  const resp = await api.post(
    `/products/${productId}/resolve_variation`,
    mapping
  );
  return resp.data;
}
