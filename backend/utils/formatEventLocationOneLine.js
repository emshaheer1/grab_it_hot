/** Venue + street + city, state ZIP — same rules as frontend helpers. */
function formatEventLocationOneLine(loc) {
  if (!loc || typeof loc !== 'object') return '';
  const venue = String(loc.venue || '').trim();
  const address = String(loc.address || '').trim();
  const city = String(loc.city || '').trim();
  const state = String(loc.state || '').trim();
  const zipCode = String(loc.zipCode || '').trim();
  const left = [venue, address].filter(Boolean).join(' ').trim();
  const stateZip = [state, zipCode].filter(Boolean).join(' ').trim();
  const right = [city, stateZip].filter(Boolean).join(', ').trim();
  if (left && right) return `${left}, ${right}`;
  if (left) return left;
  if (right) return right;
  return '';
}

module.exports = { formatEventLocationOneLine };
