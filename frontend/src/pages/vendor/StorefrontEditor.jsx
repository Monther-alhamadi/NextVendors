import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Palette, Image, Type, Megaphone, Eye, Save, Lock, Sparkles, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../store/authStore.jsx";
import api from "../../services/api";
import styles from "./StorefrontEditor.module.css";

/* ═══════════════════════════════════════════════════════════
   LIVE STOREFRONT PREVIEW EDITOR
   Split-screen: Left sidebar controls, Right live preview
   ═══════════════════════════════════════════════════════════ */

export default function StorefrontEditor() {
  const { t } = useTranslation("vendor");
  const navigate = useNavigate();
  const { user } = useAuth();

  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [canCustomize, setCanCustomize] = useState(false);

  // Editable state
  const [form, setForm] = useState({
    name: "",
    description: "",
    logo_url: "",
    theme_color: "#6366f1",
    background_image_url: "",
    announcement_text: "",
  });

  useEffect(() => {
    loadVendor();
  }, []);

  async function loadVendor() {
    try {
      setLoading(true);
      const res = await api.get("/vendors/me");
      const v = res.data;
      setVendor(v);
      setForm({
        name: v.name || "",
        description: v.description || "",
        logo_url: v.logo_url || "",
        theme_color: v.theme_color || "#6366f1",
        background_image_url: v.background_image_url || "",
        announcement_text: v.announcement_text || "",
      });
      // Check if user capabilities allow customization (Elite features or override)
      setCanCustomize(!!v.capabilities?.can_customize_store);
    } catch (err) {
      console.error("Error loading vendor", err);
    } finally {
      setLoading(false);
    }
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.put("/vendors/me", form);
    } catch (err) {
      console.error("Save failed", err);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.editorPage}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>{t("storefront_editor.loading", "Loading editor...")}</p>
        </div>
      </div>
    );
  }

  const COLOR_PRESETS = ["#6366f1", "#ec4899", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#14b8a6"];

  return (
    <div className={styles.editorPage}>
      {/* ── Sidebar Controls ── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <button className={styles.backBtn} onClick={() => navigate("/vendor")}>
            <ArrowLeft size={18} />
          </button>
          <h2>{t("storefront_editor.title", "Store Editor")}</h2>
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={16} />
            {saving ? t("common.loading") : t("common.save")}
          </button>
        </div>

        <div className={styles.controlsScroll}>
          {/* Store Name */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>
              <Type size={14} /> {t("storefront_editor.store_name", "Store Name")}
            </label>
            <input
              type="text"
              className={styles.input}
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
            />
          </div>

          {/* Description */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>
              <Type size={14} /> {t("storefront_editor.description", "Description")}
            </label>
            <textarea
              className={styles.textarea}
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={3}
            />
          </div>

          {/* Logo URL */}
          <div className={styles.controlGroup}>
            <label className={styles.controlLabel}>
              <Image size={14} /> {t("storefront_editor.logo", "Logo URL")}
            </label>
            <input
              type="url"
              className={styles.input}
              value={form.logo_url}
              onChange={(e) => updateField("logo_url", e.target.value)}
              placeholder="https://..."
            />
          </div>

          {/* Theme Color */}
          <div className={`${styles.controlGroup} ${!canCustomize ? styles.locked : ""}`}>
            <label className={styles.controlLabel}>
              <Palette size={14} /> {t("storefront_editor.theme_color", "Theme Color")}
              {!canCustomize && <Lock size={12} className={styles.lockIcon} />}
            </label>
            {!canCustomize && (
              <div className={styles.paywall}>
                <Sparkles size={16} />
                <span>{t("storefront_editor.elite_required", "Upgrade to Elite to unlock")}</span>
              </div>
            )}
            <div className={styles.colorRow}>
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  className={`${styles.colorSwatch} ${form.theme_color === c ? styles.activeSwatch : ""}`}
                  style={{ background: c }}
                  onClick={() => canCustomize && updateField("theme_color", c)}
                  disabled={!canCustomize}
                />
              ))}
              <input
                type="color"
                className={styles.colorPicker}
                value={form.theme_color}
                onChange={(e) => canCustomize && updateField("theme_color", e.target.value)}
                disabled={!canCustomize}
              />
            </div>
          </div>

          {/* Background Image */}
          <div className={`${styles.controlGroup} ${!canCustomize ? styles.locked : ""}`}>
            <label className={styles.controlLabel}>
              <Image size={14} /> {t("storefront_editor.bg_image", "Background Image")}
              {!canCustomize && <Lock size={12} className={styles.lockIcon} />}
            </label>
            <input
              type="url"
              className={styles.input}
              value={form.background_image_url}
              onChange={(e) => canCustomize && updateField("background_image_url", e.target.value)}
              placeholder="https://..."
              disabled={!canCustomize}
            />
          </div>

          {/* Announcement */}
          <div className={`${styles.controlGroup} ${!canCustomize ? styles.locked : ""}`}>
            <label className={styles.controlLabel}>
              <Megaphone size={14} /> {t("storefront_editor.announcement", "Announcement")}
              {!canCustomize && <Lock size={12} className={styles.lockIcon} />}
            </label>
            <input
              type="text"
              className={styles.input}
              value={form.announcement_text}
              onChange={(e) => canCustomize && updateField("announcement_text", e.target.value)}
              placeholder={t("storefront_editor.announcement_placeholder", "e.g. Free shipping this week!")}
              disabled={!canCustomize}
            />
          </div>
        </div>
      </aside>

      {/* ── Live Preview ── */}
      <main className={styles.preview}>
        <div className={styles.previewHeader}>
          <Eye size={16} />
          <span>{t("storefront_editor.live_preview", "Live Preview")}</span>
        </div>

        <div className={styles.previewFrame}>
          {/* Announcement Bar */}
          {form.announcement_text && (
            <div className={styles.previewAnnouncement} style={{ background: form.theme_color }}>
              <Megaphone size={14} />
              {form.announcement_text}
            </div>
          )}

          {/* Store Banner */}
          <div
            className={styles.previewBanner}
            style={{
              background: form.background_image_url
                ? `url(${form.background_image_url}) center/cover`
                : `linear-gradient(135deg, ${form.theme_color}, ${form.theme_color}bb)`,
            }}
          >
            <div className={styles.previewBannerOverlay} />
            <div className={styles.previewBannerContent}>
              {form.logo_url ? (
                <img src={form.logo_url} alt="" className={styles.previewLogo} />
              ) : (
                <div className={styles.previewLogoPlaceholder} style={{ borderColor: form.theme_color }}>
                  {form.name?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}
              <h2 className={styles.previewStoreName}>{form.name || t("storefront_editor.your_store", "Your Store")}</h2>
              <p className={styles.previewStoreDesc}>
                {form.description || t("storefront_editor.desc_placeholder", "Your store description will appear here.")}
              </p>
            </div>
          </div>

          {/* Mock Product Grid */}
          <div className={styles.previewProducts}>
            <h3 style={{ margin: "0 0 12px", fontSize: "1rem", fontWeight: 700 }}>
              {t("storefront_editor.products_preview", "Products")}
            </h3>
            <div className={styles.mockGrid}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={styles.mockProduct}>
                  <div className={styles.mockImg} />
                  <div className={styles.mockText} />
                  <div className={styles.mockPrice} style={{ background: `${form.theme_color}15`, color: form.theme_color }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
