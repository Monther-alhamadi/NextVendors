import React, { useState } from "react";
import { useToast } from "../components/common/ToastProvider";
import Input from "../components/common/Input";
import { useTranslation } from "react-i18next";

export default function Contact() {
  const [msg, setMsg] = useState("");
  const toast = useToast();
  const { t } = useTranslation();

  function submit(e) {
    e.preventDefault();
    toast.push({ message: t('contact.success'), duration: 3500 });
    setMsg("");
  }

  return (
    <div className="container">
      <h1>{t('contact.title')}</h1>
      <form onSubmit={submit} style={{ maxWidth: 600 }}>
        <div>
          <Input 
            label={t('contact.message')}
            multiline
            rows={5}
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            required
            containerClassName="contact-input"
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="submit">{t('contact.send')}</button>
        </div>
      </form>
    </div>
  );
}
