import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container">
      <h1>لم يتم العثور على الصفحة</h1>
      <p>يبدو أن الرابط الذي زرته غير صحيح أو أن الصفحة غير موجودة.</p>
      <p>
        <Link to="/">العودة إلى الصفحة الرئيسية</Link>
      </p>
    </div>
  );
}
