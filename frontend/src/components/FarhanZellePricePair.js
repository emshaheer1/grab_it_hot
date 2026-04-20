import React from 'react';
import { formatCurrency, farhanZelleUnitPrice } from '../utils/helpers';

/** Strikethrough list price + Zelle unit price (Farhan events only). */
export default function FarhanZellePricePair({ listPrice, strikeStyle = {}, currentStyle = {}, gap = 8 }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'baseline', gap, flexWrap: 'wrap' }}>
      <span
        style={{
          textDecoration: 'line-through',
          color: 'var(--text-muted)',
          ...strikeStyle,
        }}
      >
        {formatCurrency(listPrice)}
      </span>
      <span style={currentStyle}>{formatCurrency(farhanZelleUnitPrice(listPrice))}</span>
    </span>
  );
}
