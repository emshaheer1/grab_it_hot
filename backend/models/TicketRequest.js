const mongoose = require('mongoose');

const ticketRequestSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    eventTitle: { type: String, required: true },
    tierId: { type: mongoose.Schema.Types.ObjectId, required: true },
    tierName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    notes: { type: String, default: '' },
    paymentScreenshot: { type: String, default: '' },
    status: { type: String, enum: ['new', 'reviewed'], default: 'new' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('TicketRequest', ticketRequestSchema);
