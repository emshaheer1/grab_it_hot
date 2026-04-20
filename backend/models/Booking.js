const mongoose = require('mongoose');
const crypto = require('crypto');

function shortBookingId() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const buf = crypto.randomBytes(5);
  let s = '';
  for (let i = 0; i < 5; i += 1) s += chars[buf[i] % chars.length];
  return `GIH-${s}`;
}

const BookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, default: shortBookingId, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    ticketTier: {
      tierId: mongoose.Schema.Types.ObjectId,
      name: { type: String, required: true },
      pricePerTicket: { type: Number, required: true },
    },
    quantity: { type: Number, required: true, min: 1, max: 10 },
    totalAmount: { type: Number, required: true },
    attendeeInfo: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    promoCode: { type: String },
    discount: { type: Number, default: 0 },
    status: { type: String, enum: ['confirmed', 'cancelled', 'pending'], default: 'confirmed' },
    qrCode: { type: String },
    emailSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', BookingSchema);
