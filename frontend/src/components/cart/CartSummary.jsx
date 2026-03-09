import React from "react";
import CustomButton from "../common/CustomButton";
import { CartIcon } from "../common/Icons";
import { useTranslation } from "react-i18next";

export default function CartSummary({ items }) {
  const { t } = useTranslation();
  const subtotal = items.reduce(
    (acc, it) => acc + it.product.price * it.quantity,
    0
  );
  const shipping = subtotal > 100 ? 0 : 9.99;
  const total = subtotal + shipping;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-slate-600">
        <span className="font-medium">{t('product.quantity')}</span>
        <span className="font-bold text-slate-800">{items.reduce((acc, it) => acc + it.quantity, 0)}</span>
      </div>
      <div className="flex justify-between items-center text-slate-600">
        <span className="font-medium">{t('cart.total')}</span>
        <span className="font-bold text-slate-800">
          {subtotal.toLocaleString()} {t('common.currency')}
        </span>
      </div>
      <div className="flex justify-between items-center text-slate-600">
        <span className="font-medium">Shipping</span>
        <span className={`font-bold ${shipping === 0 ? 'text-emerald-500' : 'text-slate-800'}`}>
          {shipping === 0 ? "Free" : `${shipping.toLocaleString()} ${t('common.currency')}`}
        </span>
      </div>
      
      <div className="pt-4 border-t border-slate-100 mt-4">
        <div className="flex justify-between items-center mb-6">
          <span className="text-lg font-black text-slate-800">{t('cart.total')}</span>
          <span className="text-2xl font-black text-indigo-600">
            {total.toLocaleString()} {t('common.currency')}
          </span>
        </div>
      </div>
    </div>
  );
}
