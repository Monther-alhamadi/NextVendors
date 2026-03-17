import { useNavigate, useSearchParams, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "../components/common/ToastProvider";
import { useAuth } from "../store/authStore.jsx";
import { useTranslation } from "react-i18next";
import CustomButton from "../components/common/CustomButton";
import withMonitoring from "../components/withMonitoring";
import { error as logError } from "../utils/logger";
import Input from "../components/common/Input";
import api from "../services/api";
import * as authService from "../services/authService";
import styles from "./Auth.module.css";
import GoogleAuthButton from "../components/auth/GoogleAuthButton";

function AuthPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const { login, updateAuth } = useAuth();

  // Mode: 'login' or 'register'
  const initialMode = location.pathname.includes("register") ? "register" : "login";
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  
  // 2FA State
  const [mfaData, setMfaData] = useState({ required: false, userId: null, code: "" });
  
  // Email Verification State
  const [verificationData, setVerificationData] = useState({ required: false, email: "", code: "" });

  const adminSignIn = (searchParams.get("admin") || "0") === "1";

  // Sync mode with URL if it changes
  useEffect(() => {
    setMode(location.pathname.includes("register") ? "register" : "login");
    setError(null);
    
    // Load Remembered Email
    const savedEmail = localStorage.getItem("remembered_email");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, [location.pathname]);

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

  const strength = getPasswordStrength(password);

  const completeLogin = (data) => {
    const role = data?.user?.role || data?.role;
    if (updateAuth) updateAuth(data);

    // Persist Remember Me
    if (rememberMe) {
      localStorage.setItem("remembered_email", email);
    } else {
      localStorage.removeItem("remembered_email");
    }

    if (role === "admin") {
      toast.push({ message: `${t("auth.welcome_back")} (Admin)`, duration: 3000 });
      navigate("/admin");
    } else {
      toast.push({ message: t("auth.welcome_back"), duration: 2000 });
      navigate("/");
    }
  };

  async function handleLogin(e) {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.mfa_required) {
        setMfaData({ required: true, userId: data.user_id, code: "" });
        setLoading(false);
        return;
      }
      completeLogin(data);
    } catch (err) {
      logError("Login failed", { err: err?.response?.data || err?.message || String(err) });
      const detail = err?.response?.data?.detail;
      // Handle unverified account
      if (detail && (detail.includes("تفعيل") || detail.includes("verify"))) {
        setVerificationData({ required: true, email: email, code: "" });
        toast.push({ message: t("auth.verification_required"), type: "warning" });
      } else {
        setError(detail || t("common.error"));
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSuccess(credential) {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.googleLogin(credential);
      completeLogin(data);
    } catch (err) {
      logError("Google Login failed", { err: err?.response?.data || err?.message || String(err) });
      setError(err?.response?.data?.detail || t("auth.google_login_failed"));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    if (e) e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t("auth.passwords_mismatch"));
      return;
    }

    setLoading(true);
    try {
      // For registration, we use username as the primary ID if email isn't explicitly separated
      // But usually, enterprise registration needs both.
      await authService.register(username, email, password);
      toast.push({ message: `${t("auth.join_us")}! 🎉`, duration: 3500 });
      
      // Auto-trigger verification step
      setVerificationData({ required: true, email: email, code: "" });
      toast.push({ message: t("auth.check_email_otp"), duration: 5000 });
    } catch (err) {
      logError("Register failed", { err: err?.response?.data || err?.message || String(err) });
      setError(err?.response?.data?.detail || t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  // Resend OTP Countdown
  const [countdown, setCountdown] = useState(0);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  async function handleMfaVerify() {
    setLoading(true);
    try {
      const res = await api.post("/auth/verify-2fa", {
        user_id: mfaData.userId,
        code: mfaData.code,
      });
      completeLogin(res.data);
    } catch (err) {
      setError(t("auth.invalid_2fa"));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyEmail() {
    setLoading(true);
    setError(null);
    try {
      await authService.verifyEmail(verificationData.email, verificationData.code);
      toast.push({ message: t("auth.verification_success"), type: "success" });
      setVerificationData({ required: false, email: "", code: "" });
      setMode("login");
      navigate("/login");
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(detail || t("auth.invalid_code"));
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    if (countdown > 0) return;
    setLoading(true);
    setError(null);
    try {
      await authService.resendOtp(verificationData.email);
      toast.push({ message: t("auth.otp_resent"), type: "success" });
      setCountdown(60);
    } catch (err) {
      setError(err?.response?.data?.detail || t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateEmail() {
    if (!newEmail || newEmail === verificationData.email) {
      setIsEditingEmail(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authService.updateEmail(verificationData.email, newEmail);
      toast.push({ message: t("auth.email_updated"), type: "success" });
      setVerificationData({ ...verificationData, email: newEmail });
      setIsEditingEmail(false);
      setCountdown(60);
    } catch (err) {
      setError(err?.response?.data?.detail || t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.authContainer}>
        {/* Visual Side */}
        <div className={`${styles.visual} ${mode === 'register' ? styles.visualRegister : ''} ${verificationData.required ? styles.visualVerified : ''}`}>
          <div className={styles.visualContent}>
            <div className={styles.visualIcon}>
              {verificationData.required ? '✉️' : (mode === 'login' ? '🔐' : '🚀')}
            </div>
            <h2>{verificationData.required ? t("auth.verify_title") : (mode === 'login' ? t("auth.welcome_back") : t("auth.join_us"))}</h2>
            <p>{t("home.hero.subtitle")}</p>
          </div>
        </div>

        {/* Form Side */}
        <div className={styles.formWrapper}>
          {verificationData.required ? (
            <div className={styles.mfaStep}>
              <div className={styles.mfaIcon}>📩</div>
              <h2>{t("auth.verify_email_title")}</h2>
              
              {!isEditingEmail ? (
                <p>
                  {t("auth.verify_email_desc")}{" "}
                  <strong>{verificationData.email}</strong>{" "}
                  <button 
                    className={styles.editEmailBtn} 
                    onClick={() => { setIsEditingEmail(true); setNewEmail(verificationData.email); }}
                  >
                    ({t("common.edit")})
                  </button>
                </p>
              ) : (
                <div className={styles.emailEditor}>
                  <input 
                    type="email" 
                    className={styles.editInput} 
                    value={newEmail} 
                    onChange={(e) => setNewEmail(e.target.value)}
                    autoFocus
                  />
                  <CustomButton size="sm" onClick={handleUpdateEmail} loading={loading}>
                    {t("common.save")}
                  </CustomButton>
                </div>
              )}

              <input
                type="text"
                placeholder="000 000"
                className={styles.mfaInput}
                maxLength={6}
                value={verificationData.code}
                onChange={(e) => setVerificationData({ ...verificationData, code: e.target.value })}
                autoFocus={!isEditingEmail}
              />
              
              {error && <div className={styles.authError}><span>❌</span> {error}</div>}

              <CustomButton
                variant="primary"
                size="lg"
                loading={loading}
                onClick={handleVerifyEmail}
                style={{ width: "100%" }}
              >
                {t("auth.verify_proceed")}
              </CustomButton>

              <div className={styles.mfaActions}>
                {countdown > 0 ? (
                  <span className={styles.resendTimer}>
                    {t("auth.resend_cooldown")} {countdown}ث
                  </span>
                ) : (
                  <button 
                    className={styles.resendBtn} 
                    onClick={handleResendOtp}
                    disabled={loading}
                  >
                    {t("auth.resend_code")}
                  </button>
                )}

                <button
                  className={styles.backBtn}
                  onClick={() => setVerificationData({ required: false, email: "", code: "" })}
                >
                  ← {t("auth.back_to_login")}
                </button>
              </div>
            </div>
          ) : !mfaData.required ? (
            <>
              <div className={styles.authHeader}>
                <h1>{mode === 'login' ? t("auth.login_title") : t("auth.register_title")}</h1>
                <p>{mode === 'login' ? t("auth.login_desc") : t("auth.register_desc")}</p>
              </div>

              {adminSignIn && (
                <div className={styles.adminNotice}>
                  <span>⚠️</span> {t("auth.admin_login")}
                </div>
              )}

              <div className={styles.tabSwitcher}>
                <button 
                  className={`${styles.tabBtn} ${mode === 'login' ? styles.activeTab : ''}`}
                  onClick={() => { setMode('login'); navigate('/login'); }}
                >
                  {t("auth.login_title")}
                </button>
                <button 
                  className={`${styles.tabBtn} ${mode === 'register' ? styles.activeTab : ''}`}
                  onClick={() => { setMode('register'); navigate('/register'); }}
                >
                  {t("auth.register_now")}
                </button>
              </div>

              <GoogleAuthButton 
                onSuccess={handleGoogleSuccess} 
                onError={(msg) => setError(msg)}
                text={mode === 'login' ? "auth.signin_with" : "auth.signup_with"} 
              />
              <div className={styles.divider}>
                <span>{t("auth.or_email")}</span>
              </div>

              <form onSubmit={mode === 'login' ? handleLogin : handleRegister} className={styles.authForm}>
                {mode === 'register' && (
                  <Input
                    label={t("auth.username")}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    containerClassName={styles.formGroup}
                    placeholder="johndoe"
                  />
                )}
                
                <Input
                  label={t("auth.email_username")}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  containerClassName={styles.formGroup}
                  placeholder="name@example.com"
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

                {mode === 'register' && strength && (
                  <div className={`${styles.strengthMeter} ${styles['strength' + strength.charAt(0).toUpperCase() + strength.slice(1)]}`}>
                    <div className={styles.strengthBar}>
                      <div className={styles.strengthSegment} />
                      <div className={styles.strengthSegment} />
                      <div className={styles.strengthSegment} />
                    </div>
                    <span className={styles.strengthLabel} style={{
                      color: strength === "weak" ? "#ef4444" : strength === "medium" ? "#f59e0b" : "#10b981"
                    }}>
                      {strength === "weak" ? t("auth.strength_weak") : 
                       strength === "medium" ? t("auth.strength_medium") : 
                       t("auth.strength_strong")}
                    </span>
                  </div>
                )}

                {mode === 'register' && (
                  <Input
                    label={t("auth.confirm_password")}
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    containerClassName={styles.formGroup}
                  />
                )}

                {mode === 'login' && (
                  <div className={styles.formOptions}>
                    <label className={styles.rememberMe}>
                      <input 
                        type="checkbox" 
                        checked={rememberMe} 
                        onChange={(e) => setRememberMe(e.target.checked)} 
                      />
                      {t("auth.remember_me")}
                    </label>
                    <Link to="/forgot-password" className={styles.forgotLink}>
                      {t("auth.forgot_password")}
                    </Link>
                  </div>
                )}

                {error && <div className={styles.authError}><span>❌</span> {error}</div>}

                <CustomButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  style={{ width: "100%", marginTop: 8 }}
                >
                  {loading ? t("common.loading") : (mode === 'login' ? t("auth.login_title") : t("auth.register_now"))}
                </CustomButton>
              </form>

              <div className={styles.authFooter}>
                {mode === 'login' ? (
                  <span>
                    {t("auth.no_account")}{" "}
                    <Link to="/register" onClick={(e) => { e.preventDefault(); setMode('register'); navigate('/register'); }}>
                      {t("auth.register_now")}
                    </Link>
                  </span>
                ) : (
                  <span>
                    {t("auth.have_account")}{" "}
                    <Link to="/login" onClick={(e) => { e.preventDefault(); setMode('login'); navigate('/login'); }}>
                      {t("auth.login_title")}
                    </Link>
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className={styles.mfaStep}>
              <div className={styles.mfaIcon}>🛡️</div>
              <h2>{t("auth.two_factor_title")}</h2>
              <p>{t("auth.two_factor_desc")}</p>

              <input
                type="text"
                placeholder="000 000"
                className={styles.mfaInput}
                maxLength={6}
                value={mfaData.code}
                onChange={(e) => setMfaData({ ...mfaData, code: e.target.value })}
                autoFocus
              />
              
              {error && <div className={styles.authError}><span>❌</span> {error}</div>}

              <CustomButton
                variant="primary"
                size="lg"
                loading={loading}
                onClick={handleMfaVerify}
                style={{ width: "100%" }}
              >
                {t("auth.verify_login")}
              </CustomButton>

              <button
                className={styles.backBtn}
                onClick={() => setMfaData({ required: false, userId: null, code: "" })}
              >
                ← {t("auth.back_to_login")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default withMonitoring(AuthPage, "AuthPage");
