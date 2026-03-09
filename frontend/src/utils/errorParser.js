export function parseAxiosError(err) {
  // If it's an axios error with response, try to parse standard FastAPI error structures.
  const result = { status: null, message: null, fieldErrors: {} };
  if (!err || typeof err !== "object") return result;
  const resp = err.response;
  if (!resp) return result;
  result.status = resp.status;
  const data = resp.data;
  if (!data) return result;
  // If detail is an array (FastAPI validation), map to fieldErrors
  const detail = data.detail;
  if (Array.isArray(detail)) {
    detail.forEach((d) => {
      // locate field name — often d.loc is ['body', 'field']
      let field = null;
      try {
        if (Array.isArray(d.loc)) field = d.loc[d.loc.length - 1];
        else if (typeof d.loc === "string") field = d.loc;
      } catch (e) {
        field = null;
      }
      const msg = d.msg || d.detail || d.message || d.type || String(d);
      if (field) result.fieldErrors[field] = msg;
    });
    result.message = "Validation error";
    return result;
  }
  // If detail is a string, set general message
  if (typeof detail === "string") {
    result.message = detail;
    return result;
  }
  // fallback to generic detail or message
  if (data.message) result.message = data.message;
  else if (data.detail) result.message = data.detail;
  else result.message = null;
  return result;
}

export default parseAxiosError;
