import React from 'react';

export default function OptimizedImage({ src, alt, width, height, sizes='(max-width: 600px) 100vw, 50vw', wrapperClassName, className, ...props }) {
  // Robustness: handle objects or missing strings
  const rawSrc = typeof src === 'object' ? src?.url : src;
  const safeSrc = (typeof rawSrc === 'string' && rawSrc.length > 0) ? rawSrc : "https://placehold.co/600x600/e2e8f0/64748b?text=No+Image";
  
  return (
    <div className={wrapperClassName}>
      <img className={className} loading="lazy" decoding="async" src={safeSrc} alt={alt} width={width} height={height} sizes={sizes} {...props} />
    </div>
  );
}
