import React, { useState } from "react";
import api from "../services/api";
import CustomButton from "./common/CustomButton";
import { useToast } from "./common/ToastProvider";
import { useTranslation } from "react-i18next";

export default function ReturnRequestModal({ order, product, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!reason) return;
    
    setSubmitting(true);
    try {
      await api.post("/rma/", {
        order_id: order.id,
        product_id: product.id,
        reason: reason
      });
      toast.push({ message: t("common.save_success"), type: "success" });
      onSuccess();
    } catch (e) {
      console.error(e);
      toast.push({ message: t("common.error"), type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">{t('orders.return')}: {product.name}</h3>
        <p className="text-sm text-gray-600 mb-4">
           {t('orders.order_id')} #{order.id}. {t('footer.support_desc', 'Please explain why you want to return this item.')}
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">{t('common.description')}</label>
            <textarea 
               className="w-full border rounded p-2"
               rows="3"
               value={reason}
               onChange={e => setReason(e.target.value)}
               placeholder="..."
               required
            />
          </div>
          
          <div className="flex justify-end gap-2">
            <CustomButton type="button" variant="secondary" onClick={onClose}>
              {t('common.cancel')}
            </CustomButton>
            <CustomButton type="submit" disabled={submitting}>
              {submitting ? t('common.processing') : t('common.submit')}
            </CustomButton>
          </div>
        </form>
      </div>
    </div>
  );
}
