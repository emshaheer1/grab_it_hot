import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, formatEventScheduleDate, getCategoryIcon, getEventMonthDayParts, isFarhanEvent, resolveEventImageUrl } from '../utils/helpers';
import FarhanZellePricePair from './FarhanZellePricePair';
import { FaCalendarDays, FaLocationDot } from 'react-icons/fa6';

const EventCard = ({ event, style }) => {
  const minPrice = event.minPrice ?? (event.ticketTiers?.[0]?.price || 0);
  const { month, day } = event.dateComingSoon ? { month: '', day: '' } : getEventMonthDayParts(event.date);
  const CategoryIcon = getCategoryIcon(event.category);

  return (
    <Link to={`/event/${event._id}`} className="event-card" style={style}>
      <div className="event-card__img-wrap">
        <img
          className="event-card__img"
          src={resolveEventImageUrl(event.image)}
          alt={event.title}
          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800'; }}
          loading="lazy"
        />
        <div className="event-card__overlay" />
        <div className="event-card__cat-badge">
          <CategoryIcon /> {event.category}
        </div>
        <div className="event-card__date-badge">{event.dateComingSoon ? 'Soon' : `${month} ${day}`}</div>
      </div>

      <div className="event-card__body">
        <h3 className="event-card__title">{event.title}</h3>
        <div className="event-card__meta">
          <div className="event-card__meta-row">
            <FaCalendarDays />
            <span>{formatEventScheduleDate(event)}</span>
          </div>
          <div className="event-card__meta-row">
            <FaLocationDot />
            <span>{event.location?.venue}, {event.location?.city}</span>
          </div>
        </div>
        <div className="event-card__footer">
          <div className="event-card__price">
            {isFarhanEvent(event) ? (
              <>
                <FarhanZellePricePair
                  listPrice={minPrice}
                  strikeStyle={{ fontSize: '0.92em' }}
                  currentStyle={{ fontFamily: 'var(--font-display)', fontWeight: 900 }}
                />
                <small>from / person</small>
              </>
            ) : (
              <>
                {formatCurrency(minPrice)}
                <small>from / person</small>
              </>
            )}
          </div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'var(--flame)', color: 'white',
            padding: '9px 18px', borderRadius: 'var(--r-pill)',
            fontSize: 13, fontWeight: 600,
            boxShadow: '0 4px 14px rgba(255,59,47,0.28)',
            transition: 'all 0.2s',
          }}>
            Book now →
          </span>
        </div>
      </div>
    </Link>
  );
};

export default EventCard;
