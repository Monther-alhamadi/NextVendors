import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  listProducts,
} from "../services/productService";
import { useToast } from "../components/common/ToastProvider";
import { useConfirm } from "../components/common/ConfirmProvider";
import AdminProductFormFields from "./AdminProductFormFields";
import AdminProductImageList from "./AdminProductImageList";
import AdminProductUpload from "./AdminProductUpload";
import AdminProductSuppliers from "./AdminProductSuppliers";
import useImageUpload from "../hooks/useImageUpload";
import useProductValidation from "../hooks/useProductValidation";
import parseAxiosError from "../utils/errorParser";
import styles from "./AdminProductEdit.module.css";

export default function AdminProductEditRefactor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [product, setProduct] = useState(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState(0);
  const [inventory, setInventory] = useState(0);
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const toast = useToast();
  const confirm = useConfirm();
  const { errors, validateFields, setErrors } = useProductValidation();

  async function loadProduct() {
      if (id && id !== "new") {
        try {
          const p = await getProduct(id);
          setProduct(p);
          setName(p.name || "");
          setPrice(p.price || 0);
          setInventory(p.inventory || 0);
          setDescription(p.description || "");
          setCategory(p.category || "");
          if (Array.isArray(p.images))
            setImages(
              p.images.map((it) => (typeof it === "string" ? it : it.url))
            );
        } catch (err) {
          console.error(err);
          toast.push({ message: t('common.error_loading_data'), duration: 4000 });
        }
      }
  }

  useEffect(() => {
    loadProduct();
    (async () => {
      try {
        const all = await listProducts("", 200);
        const cats = Array.from(
          new Set((all || []).map((x) => x.category).filter(Boolean))
        );
        setSuggestions(cats.slice(0, 20));
      } catch (e) {
        // ignore suggestions
      }
    })();
  }, [id]);

  const {
    uploading,
    uploadProgress,
    currentUploadFilename,
    handleFileSelect,
    abortUpload,
  } = useImageUpload({ toast });
  const onUploadSuccess = (url) =>
    url && setImages((prev) => [...(prev || []), url]);

  async function submit(e) {
    e.preventDefault();
    const fieldsToValidate = { name, price, inventory };
    const { isValid, errors: validationErrors } = validateFields(fieldsToValidate);
    
    if (!isValid) {
      toast.push({
        message: t('admin.fix_validation_errors'),
        duration: 3500,
      });
      focusFirstInvalidField(validationErrors);
      return;
    }
    setSaving(true);
    // Clear previous validation errors
    setErrors && setErrors({});
    try {
      const payload = {
        name,
        price: parseFloat(price),
        inventory: parseInt(inventory || 0, 10),
        description,
        category,
        images,
      };
      if (id === "new") {
        const created = await createProduct(payload);
        toast.push({ message: t('admin.product_created'), duration: 3000 });
        if (created && created.id) navigate(`/admin/products/${created.id}`);
        else navigate("/admin/products");
        return;
      }
      await updateProduct(id, payload);
      toast.push({ message: t('admin.product_saved'), duration: 3000 });
      navigate("/admin/products");
    } catch (err) {
      console.error(err);
      // Parse axios error to provide helpful validation messages if present
      const parsed = parseAxiosError(err);
      if (parsed.status === 422 && Object.keys(parsed.fieldErrors).length > 0) {
        // set field-level errors for the form and notify the user
        setErrors((prev) => ({ ...prev, ...parsed.fieldErrors }));
        toast.push({
          message: t('admin.fix_validation_errors'),
          duration: 6000,
        });
        focusFirstInvalidField(parsed.fieldErrors);
      } else if (parsed.status && parsed.status >= 400 && parsed.status < 500) {
        // client-side or auth/permission error — show message returned by server
        const msg =
          parsed.message ||
          (err.response && err.response.data && err.response.data.detail) ||
          t('admin.save_failed');
        toast.push({ message: msg, duration: 6000 });
      } else {
        // Server error / network error — generic message
        let msg = err?.message || String(err);
        // For axios errors surface server-provided detail when available
        try {
          if (err?.response?.data?.detail) msg = err.response.data.detail;
        } catch (e) {}
        toast.push({
          message: `${t('admin.save_failed')}: ${msg}`,
          duration: 8000,
        });
      }
    } finally {
      setSaving(false);
    }
  }

  function focusFirstInvalidField(errs) {
    try {
      if (!errs || typeof document === "undefined") return;
      const order = ["name", "price", "inventory"];
      for (const key of order) {
        if (errs[key]) {
          const el = document.querySelector(`[name=\"${key}\"]`);
          if (el) {
            el.scrollIntoView({ block: "center" });
            el.focus();
          }
          break;
        }
      }
    } catch (e) {
      // ignore focus exceptions
      console.warn("Failed to focus invalid field", e);
    }
  }

  async function handleDelete() {
    if (!id || id === "new") return;
    const ok = await confirm(t('admin.delete_product_confirm'));
    if (!ok) return;
    try {
      await deleteProduct(id);
      toast.push({ message: t('admin.product_deleted'), duration: 3000 });
      navigate("/admin/products");
    } catch (err) {
      console.error(err);
      toast.push({ message: t('admin.delete_failed'), duration: 6000 });
    }
  }

  function removeImage(idx) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }
  function moveImageLeft(idx) {
    if (idx <= 0) return;
    setImages((prev) => {
      const a = [...prev];
      [a[idx - 1], a[idx]] = [a[idx], a[idx - 1]];
      return a;
    });
  }
  function moveImageRight(idx) {
    setImages((prev) => {
      if (idx >= prev.length - 1) return prev;
      const a = [...prev];
      [a[idx + 1], a[idx]] = [a[idx], a[idx + 1]];
      return a;
    });
  }
  function setPrimary(idx) {
    setImages((prev) => {
      if (!prev || idx <= 0 || idx >= prev.length) return prev;
      const a = [...prev];
      const item = a.splice(idx, 1)[0];
      a.unshift(item);
      return a;
    });
  }

  return (
    <div className="container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>{id === "new" ? t('admin.create_product') : `${t('admin.edit_product')} ${id}`}</h1>
      </div>
      <form onSubmit={submit} className={styles.adminForm}>
        <AdminProductFormFields
          name={name}
          setName={setName}
          price={price}
          setPrice={setPrice}
          inventory={inventory}
          setInventory={setInventory}
          category={category}
          setCategory={setCategory}
          description={description}
          setDescription={setDescription}
          suggestions={suggestions}
          errors={errors}
          setErrors={setErrors}
          saving={saving}
          id={id}
          onDelete={handleDelete}
        />

        <div className={styles.panel}>
          <div className="field">
            <label>{t('product.images')}</label>
            <AdminProductImageList
              images={images}
              product={product}
              onMoveLeft={moveImageLeft}
              onMoveRight={moveImageRight}
              onSetPrimary={setPrimary}
              onRemove={removeImage}
            />
            <AdminProductUpload
              uploading={uploading}
              uploadProgress={uploadProgress}
              currentUploadFilename={currentUploadFilename}
              onUpload={(f) =>
                handleFileSelect(f, { onSuccess: onUploadSuccess })
              }
              onAbort={abortUpload}
            />

          </div>

          {id !== "new" && (
            <AdminProductSuppliers product={product} onUpdate={loadProduct} />
          )}

        </div>
      </form>
    </div>
  );
}
