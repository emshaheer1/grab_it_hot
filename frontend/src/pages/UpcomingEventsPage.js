import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EventCard from '../components/EventCard';
import api from '../utils/api';

const UpcomingEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/events', { params: { status: 'upcoming', limit: 48 } })
      .then((r) => setEvents(r.data.data || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="events-page">
      <section className="events-page__hero">
        <div className="container events-page__hero-inner">
          <div className="eyebrow">Live &amp; on sale</div>
          <h1>Upcoming events</h1>
          <p>
            Browse concerts and experiences you can book now. Secure your spot before tickets sell out.
          </p>
          <div className="events-page__tabs">
            <span className="events-page__tab events-page__tab--active">Upcoming</span>
            <Link to="/events/past" className="events-page__tab">Past events</Link>
          </div>
        </div>
      </section>

      <section className="section events-page__grid-section">
        <div className="container">
          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : events.length === 0 ? (
            <div className="events-page__empty">
              <p>No upcoming events right now.</p>
              <Link to="/" className="btn btn-primary">Back to home</Link>
            </div>
          ) : (
            <div className="events-page__grid">
              {events.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default UpcomingEventsPage;
