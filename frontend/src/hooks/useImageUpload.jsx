import { useRef, useState, useCallback } from "react";
import api from "../services/api";

export default function useImageUpload({ toast } = {}) {
  const uploadXhrRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadFilename, setCurrentUploadFilename] = useState("");

  const cloudName = import.meta?.env?.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta?.env?.VITE_CLOUDINARY_UPLOAD_PRESET;

  function getCookie(name) {
    if (typeof document === "undefined") return null;
    const v = document.cookie.match("(?:^|;)\\s*" + name + "=([^;]+)");
    return v ? decodeURIComponent(v[1]) : null;
  }

  function getAuthToken() {
    // Try getting from api defaults first (set by authStore)
    try {
      const authHeader = api.defaults.headers.common["Authorization"];
      if (authHeader) return authHeader;
    } catch (e) {
      // ignore
    }
    // Try getting from cookie as fallback
    const cookie = getCookie("access_token");
    if (cookie) return `Bearer ${cookie}`;
    return null;
  }

  function uploadToCloudinary(file) {
    return new Promise((resolve, reject) => {
      if (!cloudName || !uploadPreset)
        return reject(new Error("Cloudinary not configured"));
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", uploadPreset);
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable)
          setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch (e) {
            reject(e);
          }
        } else {
          reject(new Error(`Upload failed ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error("Network error during upload"));
      uploadXhrRef.current = xhr;
      xhr.send(fd);
    });
  }

  async function cloudinarilySignedUpload(file) {
    try {
      const headers = { "Content-Type": "application/json" };
      const authToken = getAuthToken();
      if (authToken) headers["Authorization"] = authToken;

      const resp = await fetch(`/api/v1/cloudinary-sign`, {
        method: "GET",
        credentials: "include",
        headers,
      });
      if (!resp.ok) throw new Error("Cloudinary signing not available");
      const payload = await resp.json();
      const { cloud_name, api_key, upload_url, timestamp, signature, folder } =
        payload || {};
      if (!cloud_name || !api_key || !upload_url || !timestamp || !signature)
        throw new Error("Cloudinary sign response incomplete");

      const fd = new FormData();
      fd.append("file", file);
      fd.append("api_key", api_key);
      fd.append("timestamp", String(timestamp));
      fd.append("signature", signature);
      if (folder) fd.append("folder", folder);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", upload_url, true);
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable)
          setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
      };

      const result = await new Promise((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (e) {
              reject(e);
            }
          } else reject(new Error(`Upload failed ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        uploadXhrRef.current = xhr;
        xhr.send(fd);
      });
      return result;
    } catch (e) {
      // propagate the error so the caller can fallback
      throw e;
    }
  }

  const abortUpload = useCallback(() => {
    try {
      uploadXhrRef.current?.abort();
    } catch (e) {
      console.warn("Abort failed", e);
    }
    setUploading(false);
    setUploadProgress(0);
    setCurrentUploadFilename("");
    uploadXhrRef.current = null;
    if (toast) {
      try {
        toast.push({ message: "Upload cancelled", duration: 2000 });
      } catch (e) {
        // ignore toast failures
      }
    }
  }, []);

  const handleFileSelect = useCallback(
    async (file, { onSuccess } = {}) => {
      if (!file) return null;
      setUploading(true);
      setUploadProgress(0);
      setCurrentUploadFilename(file.name || "");
      try {
        // Prefer signed (server-signed) uploads when available
        try {
          const data = await cloudinarilySignedUpload(file);
          const url = data.secure_url || data.url;
          if (url && typeof onSuccess === "function") onSuccess(url);
          if (toast)
            toast.push({
              message: "Uploaded image (Cloudinary signed)",
              duration: 3000,
            });
          return url;
        } catch (e) {
          // Signed upload not available or failed -> fallback to unsigned preset
          // (unsigned may not be configured either, and next fallback to server)
          if (cloudName && uploadPreset) {
            const data = await uploadToCloudinary(file);
            const url = data.secure_url || data.url;
            if (url && typeof onSuccess === "function") onSuccess(url);
            if (toast)
              toast.push({
                message: "Uploaded image (Cloudinary)",
                duration: 3000,
              });
            return url;
          }
        }
        // server fallback
        const fd = new FormData();
        fd.append("file", file);
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/v1/upload-image", true);
        xhr.withCredentials = true;
        uploadXhrRef.current = xhr;
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable)
            setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
        };
        const result = await new Promise((resolve, reject) => {
          xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const ct = xhr.getResponseHeader("content-type") || "";
                const data = ct.includes("application/json")
                  ? JSON.parse(xhr.responseText)
                  : { url: null };
                resolve(data);
              } catch (e) {
                reject(e);
              }
            } else reject(new Error(`Upload failed ${xhr.status}`));
          };
          xhr.onerror = () => reject(new Error("Network error during upload"));
          try {
            const csrf = getCookie("csrf_token");
            if (csrf) xhr.setRequestHeader("X-CSRF-Token", csrf);
            const authToken = getAuthToken();
            if (authToken) xhr.setRequestHeader("Authorization", authToken);
          } catch (e) {
            // ignore
          }
          xhr.send(fd);
        });
        if (result && result.url) {
          if (typeof onSuccess === "function") onSuccess(result.url);
          if (toast)
            toast.push({ message: "Uploaded image (server)", duration: 3000 });
        }
        return result?.url || null;
      } catch (err) {
        console.error(err);
        if (toast)
          toast.push({
            message: `Upload failed: ${err.message || err}`,
            duration: 6000,
          });
        return null;
      } finally {
        setUploading(false);
        setUploadProgress(0);
        setCurrentUploadFilename("");
        uploadXhrRef.current = null;
      }
    },
    [cloudName, uploadPreset, toast]
  );

  return {
    uploading,
    uploadProgress,
    currentUploadFilename,
    uploadXhrRef,
    handleFileSelect,
    abortUpload,
  };
}
