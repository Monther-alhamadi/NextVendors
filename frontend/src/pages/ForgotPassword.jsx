import React, { useState } from "react";
import api from "../services/api";
import { useToast } from "../components/common/ToastProvider";
import Input from "../components/common/Input";
import CustomButton from "../components/common/CustomButton";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot", { email });
      toast.push({
        message: "تم إرسال تعليمات إعادة التعيين إلى بريدك الإلكتروني",
        duration: 4000,
      });
      setEmail("");
    } catch (err) {
      console.error(err);
      toast.push({ message: "حدث خطأ، حاول لاحقاً", duration: 3000 });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h1>استعادة كلمة المرور</h1>
      <form onSubmit={submit}>
        <div style={{ marginBottom: 16 }}>
          <Input
            label="البريد الإلكتروني"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <CustomButton variant="primary" loading={loading} style={{ width: '100%' }}>
            {loading ? "جاري الإرسال..." : "أرسل تعليمات"}
          </CustomButton>
        </div>
      </form>
    </div>
  );
}
