import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PastEventCard from '../components/PastEventCard';
import api from '../utils/api';

const PastEventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/events', { params: { status: 'past', limit: 48 } })
      .then((r) => setEvents(r.data.data || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="events-page events-page--past">
      <section className="events-page__hero events-page__hero--past">
        <div className="container events-page__hero-inner">
          <div className="eyebrow">Archive</div>
          <h1>Past events</h1>
          <p>
            A look back at shows and experiences we&apos;ve hosted. Browse photos and details from events that have already taken place.
          </p>
          <div className="events-page__tabs">
            <Link to="/events/upcoming" className="events-page__tab">Upcoming</Link>
            <span className="events-page__tab events-page__tab--active">Past events</span>
          </div>
        </div>
      </section>

      <section className="section events-page__grid-section">
        <div className="container">
          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : events.length === 0 ? (
            <div className="events-page__empty">
              <p>No past events to show yet.</p>
              <Link to="/events/upcoming" className="btn btn-primary">View upcoming events</Link>
            </div>
          ) : (
            <div className="events-page__grid events-page__grid--past">
              {events.map((event) => (
                <PastEventCard key={event._id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default PastEventsPage;
