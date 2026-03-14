import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "../components/common/ToastProvider";
import CustomButton from "../components/common/CustomButton";
import Input from "../components/common/Input";
import { forgotPassword, verifyResetOtp, resetPassword } from "../services/authService";
import styles from "./Auth.module.css";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();

  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  async function handleSendEmail(e) {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await forgotPassword(email);
      toast.push({ message: "تم إرسال رمز التحقق إلى بريدك الإلكتروني", type: "success" });
      setStep(2);
      setCountdown(60);
    } catch (err) {
      setError(err?.response?.data?.detail || t("common.error"));
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    if (e) e.preventDefault();
    setError(null);
    if (!code || code.length < 6) {
      setError("الرجاء إدخال الرمز المكون من 6 أرقام");
      return;
    }
    setLoading(true);
    try {
      const res = await verifyResetOtp(email, code);
      setResetToken(res.reset_token);
      toast.push({ message: "الرمز صحيح، الرجاء إدخال كلمة المرور الجديدة", type: "success" });
      setStep(3);
    } catch (err) {
      setError(err?.response?.data?.detail || "رمز التحقق غير صحيح");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    if (e) e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) {
      setError(t("auth.passwords_mismatch", "كلمات المرور غير متطابقة"));
      return;
    }
    if (newPassword.length < 8) {
      setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(resetToken, newPassword);
      toast.push({ message: "تم تحديث كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.", type: "success", duration: 4000 });
      navigate("/login");
    } catch (err) {
      setError(err?.response?.data?.detail || "حدث خطأ أثناء التحديث");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.authContainer} style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
        <div className={styles.formWrapper} style={{ maxWidth: '480px', margin: '0 auto', width: '100%', padding: '3rem 2rem' }}>
          
          <div className={styles.authHeader}>
            <h1>{t("auth.forgot_password", "استعادة كلمة المرور")}</h1>
            <p>
              {step === 1 && "أدخل بريدك الإلكتروني المسجل لدينا وسنرسل لك رمز تحقق."}
              {step === 2 && `أدخل الرمز المرسل إلى ${email}`}
              {step === 3 && "أدخل كلمة المرور الجديدة الخاصة بك."}
            </p>
          </div>

          {error && <div className={styles.authError}><span>❌</span> {error}</div>}

          {step === 1 && (
            <form onSubmit={handleSendEmail} className={styles.authForm}>
              <Input
                label={t("auth.email_username", "البريد الإلكتروني")}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@example.com"
                containerClassName={styles.formGroup}
              />
              <CustomButton type="submit" variant="primary" size="lg" loading={loading} style={{ width: "100%", marginTop: "1rem" }}>
                {t("common.send", "إرسال رمز التحقق")}
              </CustomButton>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className={styles.authForm}>
              <div style={{ textAlign: 'center', margin: '1rem 0' }}>
                <input
                  type="text"
                  placeholder="000 000"
                  className={styles.mfaInput}
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  autoFocus
                  style={{ display: 'inline-block', width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                 <button 
                    type="button" 
                    className={styles.editEmailBtn} 
                    onClick={() => setStep(1)}
                  >
                    تعديل البريد الإلكتروني
                 </button>
              </div>

              <CustomButton type="submit" variant="primary" size="lg" loading={loading} style={{ width: "100%" }}>
                التحقق من الرمز
              </CustomButton>

              <div className={styles.mfaActions} style={{ marginTop: '1.5rem', justifyContent: 'center' }}>
                {countdown > 0 ? (
                  <span className={styles.resendTimer}>
                    إعادة الإرسال خلال {countdown}ث
                  </span>
                ) : (
                  <button 
                    type="button"
                    className={styles.resendBtn} 
                    onClick={handleSendEmail}
                    disabled={loading}
                  >
                    إعادة إرسال الرمز
                  </button>
                )}
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className={styles.authForm}>
              <Input
                label="كلمة المرور الجديدة"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                containerClassName={styles.formGroup}
              />
              <Input
                label="تأكيد كلمة المرور"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                containerClassName={styles.formGroup}
              />
              <CustomButton type="submit" variant="primary" size="lg" loading={loading} style={{ width: "100%", marginTop: "1rem" }}>
                حفظ وتسجيل الدخول
              </CustomButton>
            </form>
          )}

          <div className={styles.authFooter} style={{ marginTop: '2rem' }}>
            <span>
              <Link to="/login">← العودة لتسجيل الدخول</Link>
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
