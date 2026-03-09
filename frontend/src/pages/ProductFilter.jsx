import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CustomButton from "../components/common/CustomButton";
import Input from "../components/common/Input";
import { useTranslation } from "react-i18next";
import { Filter } from "lucide-react"; // Assuming we can use icons, or we'll use emojis/text if lib missing

export default function ProductFilter({ onFilter }) {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const { t } = useTranslation();

  const [category, setCategory] = useState(params.get("category") || "");
  const [minPrice, setMinPrice] = useState(params.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(params.get("maxPrice") || "");
  const [isExpanded, setIsExpanded] = useState(false);

  function applyFilters() {
    const p = new URLSearchParams(location.search);
    if (category) p.set("category", category);
    else p.delete("category");
    
    if (minPrice) p.set("minPrice", minPrice);
    else p.delete("minPrice");
    
    if (maxPrice) p.set("maxPrice", maxPrice);
    else p.delete("maxPrice");

    // Pass up to parent if it handles filtering, or navigate
    navigate({ pathname: window.location.pathname, search: p.toString() });
    if (onFilter) onFilter({ category, minPrice, maxPrice });
  }

  function clearFilters() {
    const p = new URLSearchParams(location.search);
    p.delete("category");
    p.delete("minPrice");
    p.delete("maxPrice");
    setCategory("");
    setMinPrice("");
    setMaxPrice("");
    navigate({ pathname: window.location.pathname, search: p.toString() });
    if (onFilter) onFilter({});
  }

  return (
    <div className="filter-container">
      <div className="filter-header">
        <h3 className="filter-title">
           <span className="icon">🌪️</span> {t('filter.apply') || "Filters"}
        </h3>
        <button 
          className="toggle-btn"
          onClick={() => setIsExpanded(!isExpanded)}
        >
           {isExpanded ? "−" : "+"}
        </button>
      </div>

      <div className={`filter-body ${isExpanded ? 'expanded' : ''}`}>
        <div className="filter-row">
           <div className="filter-group">
              <label>{t('filter.category')}</label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder={t('filter.placeholder_category')}
                className="filter-input"
              />
           </div>
           
           <div className="filter-group price-group">
              <label>{t('product.price')} ({t('common.currency')})</label>
              <div className="price-inputs">
                <Input
                  type="number"
                  placeholder={t('filter.min_price')}
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="filter-input"
                />
                <span className="separator">-</span>
                <Input
                  type="number"
                  placeholder={t('filter.max_price')}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="filter-input"
                />
              </div>
           </div>
        </div>

        <div className="filter-actions">
           <CustomButton 
             onClick={applyFilters} 
             variant="primary" 
             size="sm"
           >
             {t('filter.apply')}
           </CustomButton>
           <CustomButton
             onClick={clearFilters}
             variant="outline"
             size="sm"
           >
             {t('filter.clear')}
           </CustomButton>
        </div>
      </div>

      <style jsx>{`
        .filter-container {
          background: var(--bg-card);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-lg);
          padding: 16px 20px;
          margin-bottom: 32px;
          box-shadow: var(--shadow-sm);
        }

        .filter-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0;
        }
        
        .filter-title {
           font-family: var(--font-heading);
           font-size: 1.1rem;
           margin: 0;
           display: flex;
           align-items: center;
           gap: 8px;
        }
        .icon { font-size: 1.2rem; }

        .toggle-btn {
           background: none;
           border: 1px solid var(--border-medium);
           border-radius: 50%;
           width: 24px;
           height: 24px;
           display: none; /* Hidden on desktop usually, useful for mobile */
           align-items: center;
           justify-content: center;
           cursor: pointer;
        }

        .filter-body {
           margin-top: 16px;
           display: flex;
           align-items: flex-end;
           gap: 24px;
           flex-wrap: wrap;
        }

        .filter-row {
          display: flex;
          gap: 24px;
          flex: 1;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          min-width: 200px;
        }
        
        .filter-group label {
           font-size: 0.85rem;
           font-weight: 600;
           color: var(--text-secondary);
        }

        .price-inputs {
           display: flex;
           align-items: center;
           gap: 8px;
        }
        .separator { color: var(--text-tertiary); }

        .filter-actions {
           display: flex;
           gap: 12px;
           padding-bottom: 4px; /* Align with inputs */
        }

        @media (max-width: 768px) {
           .filter-row { flex-direction: column; gap: 16px; }
           .toggle-btn { display: flex; }
           .filter-body { 
              display: none; 
              flex-direction: column; 
              align-items: stretch;
           }
           .filter-body.expanded { display: flex; }
           .filter-header { margin-bottom: 0; }
        }
      `}</style>
    </div>
  );
}
