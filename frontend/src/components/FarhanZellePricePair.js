import React from 'react';
import { formatCurrency, discountedEventUnitPrice } from '../utils/helpers';

/** Strikethrough list price + discounted unit price for direct-pay events. */
export default function FarhanZellePricePair({ event, listPrice, strikeStyle = {}, currentStyle = {}, gap = 8 }) {
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
      <span style={currentStyle}>{formatCurrency(discountedEventUnitPrice(event, listPrice))}</span>
    </span>
  );
}
