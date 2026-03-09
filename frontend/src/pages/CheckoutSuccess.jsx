import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function CheckoutSuccess() {
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const orderId = params.get("orderId");

  return (
    <div className="container">
      <h1>تم تأكيد الطلب</h1>
      {orderId ? (
        <p>
          معرف الطلب: <strong>{orderId}</strong>
        </p>
      ) : (
        <p>تم استلام طلبك. سنرسل تفاصيل الطلب عبر البريد الإلكتروني.</p>
      )}
      <p>
        <Link to="/orders">عرض الطلبات</Link> •{" "}
        <Link to="/">العودة للتسوق</Link>
      </p>
    </div>
  );
}
