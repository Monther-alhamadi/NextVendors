import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { useToast } from "../components/common/ToastProvider";
import Input from "../components/common/Input";
import CustomButton from "../components/common/CustomButton";

export default function ResetPassword() {
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
      toast.push({ message: "كلمتا المرور غير متطابقتين", duration: 3000 });
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset", { token, password });
      toast.push({
        message: "تم تحديث كلمة المرور. سجل الدخول الآن.",
        duration: 3000,
      });
      navigate("/login");
    } catch (err) {
      console.error(err);
      toast.push({
        message: "فشل إعادة التعيين، تحقق من الرابط أو جرب مرة أخرى",
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h1>إعادة تعيين كلمة المرور</h1>
      <form onSubmit={submit}>
        <div style={{ marginBottom: 16 }}>
          <Input
            label="كلمة المرور الجديدة"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <Input
            label="تأكيد كلمة المرور"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <CustomButton variant="primary" loading={loading} style={{ width: '100%' }}>
            {loading ? "جاري..." : "تحديث"}
          </CustomButton>
        </div>
      </form>
    </div>
  );
}
