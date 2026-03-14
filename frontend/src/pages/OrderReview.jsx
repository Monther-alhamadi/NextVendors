import React from "react";
import { useTranslation } from "react-i18next";
import cartStore from "../store/cartStore";
import { useNavigate } from "react-router-dom";
import CustomButton from "../components/common/CustomButton";

export default function OrderReview() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const items = cartStore.items;
  const total = cartStore.total;

  function proceed() {
    navigate("/checkout");
  }

  return (
    <div className="container">
      <h1>{t('auto_630255', t('auto_630255', 'مراجعة الطلب'))}</h1>
      {items.length === 0 ? (
        <div>{t('auto_3e86e9', t('auto_3e86e9', 'سلتك فارغة.'))}</div>
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
          <div>{t('orders.total', 'الإجمالي:')} ${total}</div>
          <CustomButton onClick={proceed} variant="primary" size="md">
            {t('orders.proceed_to_pay', 'متابعة للدفع')}
          </CustomButton>
        </>
      )}
    </div>
  );
}
