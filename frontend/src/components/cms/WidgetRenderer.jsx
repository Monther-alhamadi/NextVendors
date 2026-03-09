import React from 'react';
import { HeroWidget } from './HeroWidget';
import { SliderWidget } from './SliderWidget';
import { FeaturesWidget } from './FeaturesWidget';

export default function WidgetRenderer({ widget }) {
  if (!widget.is_active) return null;

  switch (widget.type) {
    case 'HeroWidget':
      return <HeroWidget config={widget.config} />;
    case 'SliderWidget':
      return <SliderWidget config={widget.config} />;
    case 'FeaturesWidget':
      return <FeaturesWidget config={widget.config} />;
    // Fallback for simple grids
    case 'GridWidget':
      return (
         <div style={{ padding: '3rem 5%', textAlign: 'center', background: widget.config?.bg_color || 'transparent' }}>
             <h3>{widget.config?.title || "قسم جديد"}</h3>
             <p style={{ color: 'var(--text-muted)' }}>{widget.config?.subtitle || "جاري تطوير القالب"}</p>
         </div>
      );
    default:
      console.warn(`Unknown widget type: ${widget.type}`);
      return null;
  }
}
