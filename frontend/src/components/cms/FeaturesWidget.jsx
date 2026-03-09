import React from 'react';
import { useTranslation } from 'react-i18next';

// This is a static representation matching the original Landing features.
// It can be expanded to read true dynamic item arrays from config.
export function FeaturesWidget({ config }) {
  const { t } = useTranslation();

  const DEFAULT_FEATURES = [
    { icon: "🚀", titleKey: "home.features.delivery",     descKey: "home.features.delivery_desc",     title: "توصيل سريع خلال 24 ساعة",        desc: "نوصل طلبك إلى باب منزلك بأسرع وقت ممكن" },
    { icon: "💎", titleKey: "home.features.quality",      descKey: "home.features.quality_desc",      title: "جودة لا تُضاهى",                 desc: "كل منتج يمر بفحص دقيق لضمان أعلى معايير الجودة" },
    { icon: "🛡️", titleKey: "home.features.payment",    descKey: "home.features.payment_desc",      title: "دفع آمن ومحمي 100%",               desc: "بياناتك محمية بأحدث تقنيات التشفير والأمان" },
    { icon: "🔄", titleKey: "home.features.returns",     descKey: "home.features.returns_desc",      title: "إرجاع مجاني خلال 30 يوم",          desc: "غير راضٍ؟ أعد المنتج مجاناً دون أي أسئلة" },
  ];

  const features = config.items?.length > 0 ? config.items : DEFAULT_FEATURES;

  return (
    <section 
      style={{ 
        background: config.bg_color || "var(--bg-card)", 
        borderTop: "1px solid var(--border-light)", 
        borderBottom: "1px solid var(--border-light)" 
      }}
    >
      <div className="container" style={{ paddingBlock: "3rem" }}>
        {config.title && (
            <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1.75rem', fontWeight: 800 }}>{config.title}</h2>
        )}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "2rem",
        }}>
          {features.map((f, index) => (
            <div key={index} style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <div style={{
                width: 52, height: 52, flexShrink: 0,
                background: "var(--primary-subtle)",
                borderRadius: "var(--radius-lg)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.5rem",
              }}>
                {f.icon || '✨'}
              </div>
              <div>
                <h4 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: "var(--text-base)", color: "var(--text-primary)", marginBottom: "4px" }}>
                  {f.titleKey ? t(f.titleKey) : f.title}
                </h4>
                <p style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)", lineHeight: 1.5 }}>
                  {f.descKey ? t(f.descKey) : f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
