import React from "react";
import OptimizedImage from "../OptimizedImage";
import CustomButton from "../common/CustomButton";
import { TrashIcon } from "../common/Icons";
import { useTranslation } from "react-i18next";
import { getLocalizedField } from "../../utils/localization";

export default function CartItem({ item, onRemove, onUpdate }) {
  const { t, i18n } = useTranslation();
  
  // Extract correct image URL
  const firstImg = item.product.images?.[0];
  const imgSrc = typeof firstImg === 'string' ? firstImg : (firstImg?.url || "");

  return (
    <div className="flex items-center gap-6 group">
      <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 transition-transform group-hover:scale-105">
        <OptimizedImage
          src={imgSrc}
          alt={getLocalizedField(item.product, "name", i18n.language)}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-lg font-bold text-slate-800 truncate mb-1">
          {getLocalizedField(item.product, "name", i18n.language)}
        </h4>
        <div className="text-indigo-600 font-bold mb-4">
          {item.product.price.toLocaleString()} {t('common.currency')}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-slate-200">
            <button 
              onClick={() => onUpdate(item.product.id, Math.max(1, item.quantity - 1))}
              className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-indigo-600 transition-colors"
            >
              −
            </button>
            <input
              id={`qty-${item.product.id}`}
              type="number"
              className="w-12 bg-transparent border-none text-center font-bold text-slate-800 focus:ring-0 p-0"
              value={item.quantity}
              min={1}
              onChange={(e) =>
                onUpdate(item.product.id, parseInt(e.target.value || 1))
              }
              aria-label={`Quantity for ${item.product.name}`}
            />
            <button 
              onClick={() => onUpdate(item.product.id, item.quantity + 1)}
              className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-indigo-600 transition-colors"
            >
              +
            </button>
          </div>
          
          <button
            onClick={() => onRemove(item.product.id)}
            className="flex items-center gap-2 text-rose-500 hover:text-rose-600 font-bold text-sm transition-colors py-2 px-3 rounded-lg hover:bg-rose-50"
          >
            <TrashIcon className="w-4 h-4" />
            {t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
