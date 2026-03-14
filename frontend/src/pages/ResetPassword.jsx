import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { useToast } from "../components/common/ToastProvider";
import Input from "../components/common/Input";
import CustomButton from "../components/common/CustomButton";

export default function ResetPassword() {
  const { t } = useTranslation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const params = useParams();
  const token =
    params.token || new URLSearchParams(window.location.search).get("token");

  async function submit(e) {
    e.preventDefault();
    if (password !== confirm) {
      toast.push({ message: t('auth.passwords_mismatch'), duration: 3000 });
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset", { token, password });
      toast.push({
        message: t('auth.password_reset_success'),
        duration: 3000,
      });
      navigate("/login");
    } catch (err) {
      console.error(err);
      toast.push({
        message: t('auth.password_reset_failed'),
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container" style={{ padding: '60px 20px', maxWidth: '450px', margin: '0 auto' }}>
      <h1 style={{ color: 'var(--primary)', marginBottom: '24px', textAlign: 'center' }}>
        {t('auth.reset_password_title')}
      </h1>
      <form onSubmit={submit}>
        <div style={{ marginBottom: 16 }}>
          <Input
            label={t('auth.new_password')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <Input
            label={t('auth.confirm_password')}
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            placeholder="••••••••"
          />
        </div>
        <div style={{ marginTop: 24 }}>
          <CustomButton variant="primary" loading={loading} style={{ width: '100%' }} size="lg">
            {loading ? t('common.loading') : t('common.update')}
          </CustomButton>
        </div>
      </form>
    </div>
  );
}
