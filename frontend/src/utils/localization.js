/**
 * Returns the localized value of a field based on the current language.
 * Supports the pattern: field (default/AR) and field_en.
 * 
 * @param {Object} obj - The object containing the fields (e.g., product, category).
 * @param {string} field - The base field name (e.g., 'name', 'description').
 * @param {string} currentLang - The current language code ('ar', 'en', etc.).
 * @returns {string|null} - The localized string or the original field value.
 */
export function getLocalizedField(obj, field, currentLang) {
  if (!obj) return "";
  
  // If language is English, try to get the _en variant
  if (currentLang === "en") {
    const enValue = obj[`${field}_en`];
    if (enValue && String(enValue).trim() !== "") {
      return enValue;
    }
  }
  
  // Fallback to the default field (usually Arabic)
  return obj[field] || "";
}
