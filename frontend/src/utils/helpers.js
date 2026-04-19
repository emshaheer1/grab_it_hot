import { format } from 'date-fns';
import { formatInTimeZone, toDate } from 'date-fns-tz';
import { FaBriefcase, FaLaughBeam, FaLaptopCode, FaMusic, FaPalette, FaTicketAlt, FaUtensils, FaFutbol } from 'react-icons/fa';

/** Listing / detail times for US events — stored as ISO but shown in Central (venue) time */
const EVENT_DISPLAY_TZ = 'America/Chicago';

export const formatDate = (date) => {
  try { return format(new Date(date), 'EEE, MMM d, yyyy'); }
  catch { return date; }
};

export const formatTime = (date) => {
  try { return format(new Date(date), 'h:mm a'); }
  catch { return ''; }
};

export const formatDateTime = (date) => {
  try { return format(new Date(date), 'EEE, MMM d, yyyy · h:mm a'); }
  catch { return date; }
};

/** Event start/end — always shown in venue timezone so “Apr 24, 7 PM Central” stays correct everywhere */
export const formatEventDateTime = (date) => {
  if (date == null || date === '') return '';
  try {
    return formatInTimeZone(new Date(date), EVENT_DISPLAY_TZ, 'EEE, MMM d, yyyy · h:mm a zzz');
  } catch {
    return String(date);
  }
};

export const formatEventDate = (date) => {
  if (date == null || date === '') return '';
  try {
    return formatInTimeZone(new Date(date), EVENT_DISPLAY_TZ, 'EEE, MMM d, yyyy');
  } catch {
    return String(date);
  }
};

/** Full event — uses `dateComingSoon` from API when set */
export const formatEventSchedule = (event) => {
  if (event?.dateComingSoon) return 'Coming soon';
  return formatEventDateTime(event?.date);
};

export const formatEventScheduleDate = (event) => {
  if (event?.dateComingSoon) return 'Coming soon';
  return formatEventDate(event?.date);
};

/** Month + day for card badge (Chicago date, not viewer’s local midnight) */
export const getEventMonthDayParts = (date) => {
  if (date == null || date === '') return { month: '', day: '' };
  try {
    const d = new Date(date);
    return {
      month: formatInTimeZone(d, EVENT_DISPLAY_TZ, 'MMM').toUpperCase(),
      day: formatInTimeZone(d, EVENT_DISPLAY_TZ, 'd'),
    };
  } catch {
    return { month: '', day: '' };
  }
};

/** UTC instant → value for `<input type="datetime-local">` as America/Chicago wall time */
export const eventDateToDatetimeLocalValue = (isoOrDate) => {
  if (isoOrDate == null || isoOrDate === '') return '';
  try {
    return formatInTimeZone(new Date(isoOrDate), EVENT_DISPLAY_TZ, "yyyy-MM-dd'T'HH:mm");
  } catch {
    return '';
  }
};

/** Parses datetime-local string as Chicago local time → ISO UTC for the API */
export const datetimeLocalValueToEventIso = (str) => {
  if (str == null || String(str).trim() === '') return undefined;
  const normalized = String(str).length === 16 ? `${str}:00` : String(str);
  try {
    const d = toDate(normalized, { timeZone: EVENT_DISPLAY_TZ });
    if (Number.isNaN(d.getTime())) return undefined;
    return d.toISOString();
  } catch {
    return undefined;
  }
};

export const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

export const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'confirmed': return 'badge-green';
    case 'cancelled': return 'badge-gray';
    default: return 'badge-red';
  }
};

export const getCategoryIcon = (category) => {
  const icons = {
    Music: FaMusic,
    Comedy: FaLaughBeam,
    Tech: FaLaptopCode,
    Sports: FaFutbol,
    Arts: FaPalette,
    Food: FaUtensils,
    Business: FaBriefcase,
    Other: FaTicketAlt,
  };
  return icons[category] || FaTicketAlt;
};
