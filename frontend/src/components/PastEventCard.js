import React from 'react';
import {
  formatEventLocationOneLine,
  formatEventScheduleDate,
  getCategoryIcon,
  getEventMonthDayParts,
  isJunooniTourEvent,
  resolveEventImageUrl,
  stripContactBlockFromDescription,
} from '../utils/helpers';
import { FaCalendarDays, FaLocationDot } from 'react-icons/fa6';

function excerpt(text, max = 140) {
  const clean = stripContactBlockFromDescription(text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max).trimEnd()}…`;
}

const PastEventCard = ({ event }) => {
  const { month, day } = getEventMonthDayParts(event.date);
  const CategoryIcon = getCategoryIcon(event.category);
  const imgClass = isJunooniTourEvent(event) ? 'past-event-card__img past-event-card__img--top' : 'past-event-card__img';

  return (
    <article className="past-event-card">
      <div className="past-event-card__img-wrap">
        <img
          className={imgClass}
          src={resolveEventImageUrl(event.image)}
          alt={event.title}
          loading="lazy"
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800'; }}
        />
        <div className="past-event-card__overlay" />
        <span className="past-event-card__cat-badge">
          <CategoryIcon /> {event.category}
        </span>
        {month && day ? (
          <span className="past-event-card__date-badge">{month} {day}</span>
        ) : null}
        <span className="past-event-card__past-pill">Past event</span>
      </div>
      <div className="past-event-card__body">
        <h3 className="past-event-card__title">{event.title}</h3>
        <div className="past-event-card__meta">
          <div className="past-event-card__meta-row">
            <FaCalendarDays />
            <span>{formatEventScheduleDate(event)}</span>
          </div>
          <div className="past-event-card__meta-row">
            <FaLocationDot />
            <span>
              {formatEventLocationOneLine(event.location) ||
                [event.location?.venue, event.location?.city].filter(Boolean).join(', ')}
            </span>
          </div>
        </div>
        {event.description ? (
          <p className="past-event-card__excerpt">{excerpt(event.description)}</p>
        ) : null}
        {event.organizer?.name ? (
          <p className="past-event-card__organizer">Presented by {event.organizer.name}</p>
        ) : null}
      </div>
    </article>
  );
};

export default PastEventCard;
