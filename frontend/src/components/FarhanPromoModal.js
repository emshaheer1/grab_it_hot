import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { FaXmark } from 'react-icons/fa6';
import api from '../utils/api';
import { formatEventScheduleDate, formatCurrency } from '../utils/helpers';

/** Set in localStorage when the user closes the promo; new visitors (no key) see the modal once. */
const STORAGE_KEY = 'gih_farhan_promo_dismissed';

function findFarhanEvent(events) {
  if (!Array.isArray(events)) return null;
  return events.find((e) => /farhan/i.test(String(e.title || ''))) || null;
}

export default function FarhanPromoModal() {
  const [event, setEvent] = useState(null);
  const [open, setOpen] = useState(false);

  const close = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* ignore */
    }
    setOpen(false);
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      /* ignore */
    }

    let cancelled = false;
    api
      .get('/events/featured')
      .then((res) => {
        const list = res.data?.data;
        const found = findFarhanEvent(list);
        if (!cancelled && found) {
          setEvent(found);
          setOpen(true);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  if (!open || !event?._id) return null;

  const minPrice = event.minPrice ?? event.ticketTiers?.[0]?.price ?? 0;

  const modal = (
    <div className="farhan-promo">
      <button type="button" className="farhan-promo__backdrop" aria-label="Close promotion" onClick={close} />
      <div
        className="farhan-promo__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="farhan-promo-title"
        aria-describedby="farhan-promo-desc"
      >
        <button type="button" className="farhan-promo__close" onClick={close} aria-label="Close">
          <FaXmark />
        </button>

        <div className="farhan-promo__grid">
          <div className="farhan-promo__visual">
            <img src={event.image} alt="" className="farhan-promo__poster" />
          </div>
          <div className="farhan-promo__content">
            <span className="farhan-promo__eyebrow">Featured this week</span>
            <h2 id="farhan-promo-title" className="farhan-promo__title">
              {event.title}
            </h2>
            <p className="farhan-promo__meta">
              {event.location?.venue} · {event.location?.city}, {event.location?.state}
            </p>
            <p id="farhan-promo-desc" className="farhan-promo__lead">
              {formatEventScheduleDate(event)} · {minPrice ? `From ${formatCurrency(minPrice)}` : 'Tickets on sale now'}
            </p>
            <p className="farhan-promo__copy">
              Don’t miss Farhan Saeed live in Chicagoland — secure your seats and be part of the night.
            </p>
            <div className="farhan-promo__actions">
              <Link to={`/event/${event._id}`} className="btn btn-primary farhan-promo__cta" onClick={close}>
                Get tickets
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
