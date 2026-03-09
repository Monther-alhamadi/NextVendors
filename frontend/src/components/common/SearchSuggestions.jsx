import React, { useEffect, useState, useRef } from "react";
import { listProducts } from "../../services/productService";
import { useNavigate } from "react-router-dom";
import cartStore from "../../store/cartStore";
import { useToast } from "./ToastProvider";
import { useTranslation } from "react-i18next";

export default function SearchSuggestions({ q, inputId = "site-search" }) {
  const [items, setItems] = useState([]);
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(-1);
  const [recentAdded, setRecentAdded] = useState(new Set());
  const toast = useToast();
  const navigate = useNavigate();
  const containerRef = useRef();
  const { t } = useTranslation();

  useEffect(() => {
    if (!q || q.length < 2) {
      setItems([]);
      setVisible(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await listProducts(q, 6);
        if (!cancelled) {
          setItems(res || []);
          setVisible(true);
          setActive(-1);
        }
      } catch (e) {
        console.error(e);
      }
    })();
    return () => (cancelled = true);
  }, [q]);

  useEffect(() => {
    function onDocClick(e) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) setVisible(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // keep input's aria-activedescendant in sync with active option for screen readers
  useEffect(() => {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (active >= 0 && items[active]) {
      const id = `${inputId}-option-${items[active].id}`;
      try {
        input.setAttribute("aria-activedescendant", id);
      } catch (e) {
        // ignore
      }
    } else {
      try {
        input.removeAttribute("aria-activedescendant");
      } catch (e) {}
    }
    return () => {
      try {
        input.removeAttribute("aria-activedescendant");
      } catch (e) {}
    };
  }, [active, items, inputId]);

  function onKeyDown(e) {
    if (!visible) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && items[active]) {
        navigate(`/products/${items[active].id}`);
        setVisible(false);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setVisible(false);
    }
  }

  if (!visible || items.length === 0) return null;

  return (
    <div
      className="search-suggestions"
      ref={containerRef}
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      <ul
        id={`${inputId}-listbox`}
        role="listbox"
        aria-label={t('nav.search_placeholder')}
      >
        {items.map((it, idx) => (
          <li
            key={it.id}
            id={`${inputId}-option-${it.id}`}
            role="option"
            aria-selected={idx === active}
            className={idx === active ? "active" : ""}
            onMouseEnter={() => setActive(idx)}
            onClick={() => {
              navigate(`/products/${it.id}`);
              setVisible(false);
            }}
          >
            <div className="ss-row">
              <img
                loading="lazy"
                decoding="async"
                src={it.images?.[0] || "/placeholder.png"}
                alt={it.name}
              />
              <div style={{ flex: 1 }}>
                <div className="ss-title">{it.name}</div>
                <div className="ss-sub">${it.price.toFixed(2)}</div>
              </div>
              <div className="ss-actions">
                <button
                  className="ss-add-btn"
                  aria-label={`${t('product.add_to_cart')} ${it.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    try {
                      cartStore.addItem(it, 1);
                      // show toast with undo
                      const toastId = toast.push({
                        message: `${it.name} ${t('search_suggestions.added')}`,
                        duration: 6000,
                        action: {
                          label: t('search_suggestions.undo'),
                          onClick: () => {
                            const found = cartStore.items.find(
                              (x) => x.product.id === it.id
                            );
                            if (found) {
                              if (found.quantity > 1) {
                                cartStore.updateQuantity(
                                  it.id,
                                  found.quantity - 1
                                );
                              } else {
                                cartStore.removeItem(it.id);
                              }
                            }
                          },
                        },
                      });
                    } catch (err) {
                      console.error("Quick add failed", err);
                      toast.push({ message: t('search_suggestions.add_failed'), duration: 3000 });
                    }
                  }}
                >
                  +
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
