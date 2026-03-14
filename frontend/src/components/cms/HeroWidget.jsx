import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';

/**
 * Premium HeroWidget — uses the same CSS classes as the original 
 * fallback hero (hero-section, hero-aurora, hero-grid, etc.) 
 * but with CMS-configurable content.
 */
export function HeroWidget({ config }) {
  const { t } = useTranslation();
  
  const title = config.title || t('home.hero.title') || 'اكتشف الفخامة في كل تفصيل';
  const subtitle = config.subtitle || t('home.hero.subtitle') || 'وجهتك الأولى للمنتجات الحصرية والمميزة. تسوق أحدث الصيحات العالمية بجودة لا تُضاهى وتوصيل يصل إليك في أسرع وقت.';
  const buttonText = config.button_text || t('home.hero.shop_new') || 'تسوق الجديد';
  const buttonLink = config.button_link || '/products?category=new';
  const bgColor = config.bg_color || '#0a0d2e';

  // If there's a custom image, use image-based hero
  if (config.image_url) {
    return (
      <section 
        style={{
          position: 'relative',
          minHeight: '600px',
          display: 'flex',
          alignItems: 'center',
          backgroundImage: `url(${config.image_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: 'clamp(3rem, 10vw, 5rem) 0',
          overflow: 'hidden',
        }}
      >
        {/* Dark overlay for readability */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 100%)',
          zIndex: 1
        }} />
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: '680px' }}>
            <h1 className="hero-title">{title}</h1>
            <p className="hero-subtitle">{subtitle}</p>
            <div className="hero-actions">
              <Link to={buttonLink}>
                <button className="btn btn-primary btn-lg" style={{ borderRadius: '999px' }}>
                  <span>🛍️</span> {buttonText}
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Premium hero with aurora effects (matches the original fallback exactly)
  return (
    <section 
      className="hero-section" 
      aria-label={t('common.welcome_section', 'قسم الترحيب')}
      style={bgColor !== '#0a0d2e' ? { background: bgColor } : undefined}
    >
      <div className="hero-aurora" aria-hidden="true" />
      <div className="hero-grid" aria-hidden="true" />

      <div className="container">
        <div className="hero-content">
          <div className="hero-badge">
            <span>⚡</span>
            <span>{t('home.hero.badge') || 'منصة التسوق الأكثر ثقة'}</span>
          </div>

          <h1 className="hero-title">
            <Trans i18nKey="home.hero.title" defaults={title}>
              {title}
            </Trans>
          </h1>

          <p className="hero-subtitle">{subtitle}</p>

          <div className="hero-actions">
            <Link to={buttonLink}>
              <button className="btn btn-primary btn-lg" style={{ borderRadius: '999px' }}>
                <span>🛍️</span>
                {buttonText}
              </button>
            </Link>
            <Link to="/products">
              <button
                className="btn btn-lg"
                style={{
                  borderRadius: '999px',
                  background: 'rgba(255,255,255,0.12)',
                  color: 'white',
                  border: '1.5px solid rgba(255,255,255,0.3)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {t('home.hero.browse_collection') || 'تصفح المجموعة'}
              </button>
            </Link>
          </div>

          {/* Trust indicators */}
          <div style={{
            marginTop: '3rem',
            display: 'flex',
            gap: '2rem',
            justifyContent: 'center',
            flexWrap: 'wrap',
            color: 'rgba(255,255,255,0.55)',
            fontSize: 'var(--text-sm)',
          }}>
            {[t('auto_ee1f6e', '🏆 +50,000 عميل راضٍ'), t('auto_a594c8', '⭐ تقييم 4.9/5'), t('auto_271fa3', '🚚 توصيل مجاني فوق 200 ر.س')].map(item => (
              <span key={item} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>{item}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
