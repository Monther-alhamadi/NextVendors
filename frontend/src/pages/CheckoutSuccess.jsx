import React from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import PageContainer from "../components/PageContainer";
import CustomButton from "../components/common/CustomButton";

export default function CheckoutSuccess() {
  const { t } = useTranslation();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const orderId = params.get("orderId");

  return (
    <PageContainer>
      <div style={{ padding: '60px 24px', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{ fontSize: '4rem', marginBottom: '24px' }}>🎉</div>
        <h1 style={{ marginBottom: '16px', color: 'var(--primary)', fontFamily: 'var(--font-heading)' }}>
          {t('checkout.confirm_title', 'Order Confirmed!')}
        </h1>
        
        {orderId ? (
          <p style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '32px' }}>
            {t('orders.order_id')}: <strong>#{orderId}</strong>
          </p>
        ) : (
          <p style={{ fontSize: '1.1rem', color: 'var(--text-tertiary)', marginBottom: '32px' }}>
            {t('checkout.success_generic', 'Your order has been received. We will send details via email shortly.')}
          </p>
        )}

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '40px' }}>
          <Link to="/orders" style={{ textDecoration: 'none' }}>
            <CustomButton variant="outline">{t('orders.title')}</CustomButton>
          </Link>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <CustomButton variant="primary">{t('home.hero.shop_now') || t('home.flash_sale.shop_now')}</CustomButton>
          </Link>
        </div>
      </div>
    </PageContainer>
  );
}
