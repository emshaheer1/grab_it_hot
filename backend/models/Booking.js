const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const BookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, default: () => 'GIH-' + uuidv4().slice(0, 8).toUpperCase(), unique: true },
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
