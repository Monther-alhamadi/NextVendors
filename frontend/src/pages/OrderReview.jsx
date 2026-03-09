import React from "react";
import cartStore from "../store/cartStore";
import { useNavigate } from "react-router-dom";
import CustomButton from "../components/common/CustomButton";

export default function OrderReview() {
  const navigate = useNavigate();
  const items = cartStore.items;
  const total = cartStore.total;

  function proceed() {
    navigate("/checkout");
  }

  return (
    <div className="container">
      <h1>مراجعة الطلب</h1>
      {items.length === 0 ? (
        <div>سلتك فارغة.</div>
      ) : (
        <>
          <ul>
            {items.map((it) => (
              <li key={it.product.id}>
                {it.product.name} × {it.quantity} = $
                {it.product.price * it.quantity}
              </li>
            ))}
          </ul>
          <div>الإجمالي: ${total}</div>
          <CustomButton onClick={proceed} variant="primary" size="md">
            متابعة للدفع
          </CustomButton>
        </>
      )}
    </div>
  );
}
