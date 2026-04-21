const Booking = require('../models/Booking');
const Event = require('../models/Event');
const User = require('../models/User');
const { formatEventLocationOneLine } = require('../utils/formatEventLocationOneLine');
const nodemailer = require('nodemailer');

const sendConfirmationEmail = async (booking, event) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to: booking.attendeeInfo.email,
      subject: `Booking Confirmed – ${event.title}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px">
          <h2 style="color:#FF4D4D">🎉 Booking Confirmed!</h2>
          <p>Hi ${booking.attendeeInfo.fullName},</p>
          <p>Your tickets for <strong>${event.title}</strong> are confirmed.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr><td style="padding:8px;background:#f7f7f7"><strong>Booking ID</strong></td><td style="padding:8px">${booking.bookingId}</td></tr>
            <tr><td style="padding:8px;background:#f7f7f7"><strong>Event</strong></td><td style="padding:8px">${event.title}</td></tr>
            <tr><td style="padding:8px;background:#f7f7f7"><strong>Date</strong></td><td style="padding:8px">${new Date(event.date).toLocaleString()}</td></tr>
            <tr><td style="padding:8px;background:#f7f7f7"><strong>Venue</strong></td><td style="padding:8px">${formatEventLocationOneLine(event.location) || `${event.location.venue}, ${event.location.city}`}</td></tr>
            <tr><td style="padding:8px;background:#f7f7f7"><strong>Ticket</strong></td><td style="padding:8px">${booking.ticketTier.name} x ${booking.quantity}</td></tr>
            <tr><td style="padding:8px;background:#f7f7f7"><strong>Total Paid</strong></td><td style="padding:8px">$${booking.totalAmount}</td></tr>
          </table>
          <p style="color:#888;font-size:13px">Present this booking ID at the venue entrance.</p>
          <p style="color:#FF4D4D;font-weight:bold">Grab It Hot 🔥</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('Email send error:', err.message);
  }
};

exports.createBooking = async (req, res, next) => {
  try {
    const { eventId, tierId, quantity, attendeeInfo, promoCode } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const tier = event.ticketTiers.id(tierId);
    if (!tier) return res.status(404).json({ success: false, message: 'Ticket tier not found' });

    const available = tier.capacity - tier.sold;
    if (quantity > available) return res.status(400).json({ success: false, message: `Only ${available} tickets left` });

    let discount = 0;
    if (promoCode && event.promoCode && promoCode.toUpperCase() === event.promoCode.toUpperCase()) {
      discount = event.promoDiscount;
    }

    const subtotal = tier.price * quantity;
    const totalAmount = Math.max(0, subtotal - (subtotal * discount) / 100);

    // Update sold count
    tier.sold += quantity;
    await event.save();

    const booking = await Booking.create({
      user: req.user.id,
      event: eventId,
      ticketTier: { tierId, name: tier.name, pricePerTicket: tier.price },
      quantity,
      totalAmount,
      attendeeInfo,
      promoCode: promoCode || undefined,
      discount,
    });

    // Link booking to user
    await User.findByIdAndUpdate(req.user.id, { $push: { bookings: booking._id } });

    // Send confirmation email (non-blocking)
    sendConfirmationEmail(booking, event);

    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
};

exports.getUserBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ user: req.user.id }).populate('event', 'title date location image').sort({ createdAt: -1 });
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    next(err);
  }
};

exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('event');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, data: booking });
  } catch (err) {
    next(err);
  }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.user.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (booking.status === 'cancelled') return res.status(400).json({ success: false, message: 'Already cancelled' });

    booking.status = 'cancelled';
    await booking.save();

    // Restore ticket count
    const event = await Event.findById(booking.event);
    if (event) {
      const tier = event.ticketTiers.id(booking.ticketTier.tierId);
      if (tier) { tier.sold = Math.max(0, tier.sold - booking.quantity); await event.save(); }
    }
    res.json({ success: true, message: 'Booking cancelled', data: booking });
  } catch (err) {
    next(err);
  }
};
