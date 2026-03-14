import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import * as authService from "../services/authService";
import { useToast } from "../components/common/ToastProvider";
import CustomButton from "../components/common/CustomButton";
import Input from "../components/common/Input";
import { useTranslation } from "react-i18next";
import styles from "./Auth.module.css";

function getPasswordStrength(pw) {
  if (!pw || pw.length < 4) return null;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return "weak";
  if (score <= 2) return "medium";
  return "strong";
}

export default function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  const strength = getPasswordStrength(password);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t("auth.passwords_mismatch"));
      return;
    }

    setLoading(true);
    try {
      if (!authService.register) {
        setError(t("auth.registration_unavailable"));
        return;
      }
      await authService.register(username, password);
      toast.push({ message: `${t("auth.join_us")}! 🎉`, duration: 3500 });
      navigate("/login");
    } catch (err) {
      console.error("Register failed", err);
      const msg = err?.response?.data?.detail || err?.message || t("common.error");
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.authContainer}>
        {/* Form Side (first on register) */}
        <div className={styles.formWrapper}>
          <div className={styles.authHeader}>
            <h1>{t("auth.register_title")}</h1>
            <p>{t("auth.register_desc")}</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.authForm}>
            <Input
              label={t("auth.username")}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
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

            {/* Password strength meter */}
            {strength && (
              <div style={{ marginTop: -10, marginBottom: 14 }}>
                <div className={styles.strengthBar}>
                  <div
                    className={`${styles.strengthFill} ${
                      strength === "weak" ? styles.strengthWeak :
                      strength === "medium" ? styles.strengthMedium :
                      styles.strengthStrong
                    }`}
                  />
                </div>
                <div className={styles.strengthLabel} style={{
                  color: strength === "weak" ? "#ef4444" : strength === "medium" ? "#f59e0b" : "#10b981"
                }}>
                  {strength === "weak"
                    ? t("auth.strength_weak")
                    : strength === "medium"
                    ? t("auth.strength_medium")
                    : t("auth.strength_strong")}
                </div>
              </div>
            )}

            <Input
              label={t("auth.confirm_password")}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              {loading ? t("common.loading") : t("auth.register_now")}
            </CustomButton>

            <div className={styles.authFooter}>
              <span>
                {t("auth.have_account")}{" "}
                <Link to="/login">{t("auth.login_title")}</Link>
              </span>
            </div>
          </form>
        </div>

        {/* Visual Side */}
        <div className={styles.visual} style={{ background: "linear-gradient(135deg, var(--accent) 0%, #b88a4d 100%)" }}>
          <div className={styles.visualContent}>
            <div className={styles.visualIcon}>🚀</div>
            <h2 style={{ color: "var(--primary)" }}>{t("auth.join_us")}</h2>
            <p style={{ color: "var(--primary)" }}>{t("home.hero.subtitle")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
