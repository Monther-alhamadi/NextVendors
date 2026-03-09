import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

export default function useProductValidation(
  initialErrors = { name: "", price: "", inventory: "" }
) {
  const { t } = useTranslation();
  const [errors, setErrors] = useState(initialErrors);

  const normalizeNumerals = (val) => {
    if (typeof val !== 'string') return val;
    return val.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
              .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
  };

  const validateFields = useCallback((fields) => {
    const { name, price, inventory } = fields;
    const errs = { name: "", price: "", inventory: "" };
    
    if (!name || name.trim().length < 2)
      errs.name = t('validation.name_length') || "Name must be at least 2 characters";
      
    const p = parseFloat(normalizeNumerals(price));
    if (Number.isNaN(p) || p < 0)
      errs.price = t('validation.price_positive') || "Price must be a non-negative number";
      
    // Default to 0 if missing or empty string
    const invInput = (inventory === "" || inventory === undefined || inventory === null) ? 0 : inventory;
    const inv = parseInt(normalizeNumerals(String(invInput)), 10);
    
    if (Number.isNaN(inv) || inv < 0)
      errs.inventory = t('validation.inventory_integer') || "Inventory must be a non-negative integer";
      
    setErrors(errs);
    const isValid = !errs.name && !errs.price && !errs.inventory;
    return { isValid, errors: errs };
  }, [t]);

  return { errors, setErrors, validateFields };
}
