import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useState } from "react";
import { useToast } from "../components/common/ToastProvider";
import { useAuth } from "../store/authStore.jsx";
import { useTranslation } from "react-i18next";
import CustomButton from "../components/common/CustomButton";
import withMonitoring from "../components/withMonitoring";
import { error as logError } from "../utils/logger";
import Input from "../components/common/Input";
import api from "../services/api";
import styles from "./Auth.module.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, updateAuth } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const adminSignIn = (searchParams.get("admin") || "0") === "1";
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { t } = useTranslation();
  const [mfaData, setMfaData] = useState({ required: false, userId: null, code: "" });

  async function handleMfaVerify() {
    setLoading(true);
    try {
      const res = await api.post("/auth/login/verify-2fa", {
        user_id: mfaData.userId,
        code: mfaData.code,
      });
      completeLogin(res.data);
    } catch (err) {
      setError(t("auth.invalid_2fa") || "Invalid 2FA code");
    } finally {
      setLoading(false);
    }
  }

  function completeLogin(data) {
    const role = data?.user?.role || data?.role;
    if (updateAuth) updateAuth(data);

    if (role === "admin") {
      toast.push({ message: `${t("auth.welcome_back")} (Admin)`, duration: 3000 });
      navigate("/admin");
    } else {
      toast.push({ message: t("auth.welcome_back"), duration: 2000 });
      navigate("/");
    }
  }

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.mfa_required) {
        setMfaData({ ...mfaData, required: true, userId: data.user_id });
        setLoading(false);
        return;
      }
      completeLogin(data);
    } catch (err) {
      logError("Login failed", { err: err?.response?.data || err?.message || String(err) });
      setError(err?.response?.data?.detail || t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.authContainer}>
        {/* Visual Side */}
        <div className={styles.visual}>
          <div className={styles.visualContent}>
            <div className={styles.visualIcon}>🔐</div>
            <h2>{t("auth.welcome_back")}</h2>
            <p>{t("home.hero.subtitle")}</p>
          </div>
        </div>

        {/* Form Side */}
        <div className={styles.formWrapper}>
          <div className={styles.authHeader}>
            <h1>{t("auth.login_title")}</h1>
            <p>{t("auth.login_desc") || t("auth.login_title")}</p>
          </div>

          {!mfaData.required ? (
            <>
              {adminSignIn && (
                <div className={styles.adminNotice}>⚠️ {t("auth.admin_login") || "Admin Login"}</div>
              )}

              <form onSubmit={handleSubmit} className={styles.authForm}>
                <Input
                  label={t("auth.email_username")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  containerClassName={styles.formGroup}
                />
                <Input
                  label={t("auth.password")}
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  containerClassName={styles.formGroup}
                />

                {error && <div className={styles.authError}>{error}</div>}

                <CustomButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  style={{ width: "100%", marginTop: 8 }}
                >
                  {loading ? t("common.loading") : t("auth.login_title")}
                </CustomButton>

                <div className={styles.authFooter}>
                  <Link to="/forgot-password">{t("auth.forgot_password")}</Link>
                  <span className={styles.divider}>|</span>
                  <span>
                    {t("auth.no_account")}{" "}
                    <Link to="/register">{t("auth.register_now")}</Link>
                  </span>
                </div>
              </form>
            </>
          ) : (
            <div className={styles.mfaStep}>
              <div className={styles.mfaIcon}>🛡️</div>
              <h2>{t("auth.two_factor_title") || "المصادقة الثنائية"}</h2>
              <p>{t("auth.two_factor_desc") || "أدخل رمز التحقق المكون من 6 أرقام"}</p>

              <input
                type="text"
                placeholder="000 000"
                className={styles.mfaInput}
                maxLength={6}
                value={mfaData.code}
                onChange={(e) => setMfaData({ ...mfaData, code: e.target.value })}
                autoFocus
              />
              {error && <div className={styles.authError}>{error}</div>}

              <CustomButton
                variant="primary"
                size="lg"
                loading={loading}
                onClick={handleMfaVerify}
                style={{ width: "100%" }}
              >
                {t("auth.verify_login") || "تحقق وسجّل الدخول"}
              </CustomButton>

              <button
                className={styles.backBtn}
                onClick={() => setMfaData({ required: false, userId: null, code: "" })}
              >
                ← {t("auth.back_to_login") || "العودة لتسجيل الدخول"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default withMonitoring(Login, "LoginPage");
