import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Search, Filter, TrendingUp, Users, Store, Sparkles } from "lucide-react";
import StoreCard from "../components/store/StoreCard";
import Skeleton from "../components/common/Skeleton";
import api from "../services/api";
import styles from "./StoresDirectory.module.css";

function StoresDirectory() {
  const { t } = useTranslation("vendor");
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    loadStores();
  }, [sortBy]);

  async function loadStores() {
    setLoading(true);
    try {
      const params = { sort_by: sortBy };
      if (search) params.search = search;
      const res = await api.get("/vendors", { params });
      setStores(res.data);
    } catch (err) {
      console.error("Failed to load stores", err);
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault();
    loadStores();
  }

  const sortOptions = [
    { value: "newest", label: t("stores.sort_newest"), icon: <Sparkles size={14} /> },
    { value: "followers", label: t("stores.sort_popular"), icon: <TrendingUp size={14} /> },
    { value: "name", label: t("stores.sort_name"), icon: <Store size={14} /> },
  ];

  return (
    <div className={styles.page}>
      {/* Hero Header */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroIcon}>
            <Store size={40} />
          </div>
          <h1>{t("stores.title")}</h1>
          <p>{t("stores.subtitle")}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <form className={styles.searchBox} onSubmit={handleSearchSubmit}>
          <Search size={18} />
          <input
            type="text"
            placeholder={t("stores.search_placeholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className={styles.sortGroup}>
          <Filter size={16} />
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              className={`${styles.sortBtn} ${sortBy === opt.value ? styles.activeSort : ""}`}
              onClick={() => setSortBy(opt.value)}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className={styles.resultsCount}>
        {!loading && (
          <span>
            {stores.length} {t("stores.results")}
          </span>
        )}
      </div>

      {/* Store Grid */}
      <div className={styles.grid}>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={styles.skeletonCard}>
                <Skeleton height={110} />
                <div style={{ padding: "20px", textAlign: "center" }}>
                  <Skeleton width={72} height={72} style={{ borderRadius: 18, margin: "-36px auto 12px" }} />
                  <Skeleton width="60%" height={18} />
                  <Skeleton width="80%" height={14} style={{ marginTop: 8 }} />
                  <Skeleton width={120} height={38} style={{ marginTop: 16, borderRadius: 12 }} />
                </div>
              </div>
            ))
          : stores.map((store) => <StoreCard key={store.id} store={store} />)}
      </div>

      {!loading && stores.length === 0 && (
        <div className={styles.empty}>
          <Store size={48} strokeWidth={1} />
          <h3>{t("stores.empty_title")}</h3>
          <p>{t("stores.empty_desc")}</p>
        </div>
      )}
    </div>
  );
}

export default StoresDirectory;
