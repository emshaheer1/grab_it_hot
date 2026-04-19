import React from 'react';

const src = `${process.env.PUBLIC_URL || ''}/grab-mark.png`;

/**
 * Hand + tickets mark from `public/grab-mark.png`.
 * Default height is in `em` so it tracks the parent text size (set font-size on the same row/link).
 * Pass a number for fixed pixels, or a string like `1.5em` / `22px` to override.
 */
export function GrabMarkIcon({ height = '1.85em', style = {}, ...rest }) {
  const resolvedHeight = typeof height === 'number' ? `${height}px` : height;

  return (
    <img
      src={src}
      alt=""
      aria-hidden
      {...rest}
      style={{
        height: resolvedHeight,
        width: 'auto',
        display: 'inline-block',
        verticalAlign: '-0.18em',
        objectFit: 'contain',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
