const mongoose = require('mongoose');

const TicketTierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  capacity: { type: Number, required: true },
  sold: { type: Number, default: 0 },
  description: { type: String },
});

const EventSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'Event title is required'], trim: true },
    description: { type: String, required: [true, 'Description is required'] },
    category: {
      type: String,
      required: true,
      enum: ['Music', 'Comedy', 'Tech', 'Sports', 'Arts', 'Food', 'Business', 'Other'],
    },
    date: { type: Date, required: [true, 'Event date is required'] },
    endDate: { type: Date },
    location: {
      venue: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      address: { type: String },
      zipCode: { type: String },
    },
    organizer: {
      name: { type: String, required: true },
      email: { type: String },
      phone: { type: String },
    },
    image: { type: String, default: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800' },
    ticketTiers: [TicketTierSchema],
    featured: { type: Boolean, default: false },
    status: { type: String, enum: ['upcoming', 'ongoing', 'completed', 'cancelled'], default: 'upcoming' },
    tags: [String],
    promoCode: { type: String },
    promoDiscount: { type: Number, default: 0 },
    /** When true, public UI shows “Coming soon” instead of scheduled date/time */
    dateComingSoon: { type: Boolean, default: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

EventSchema.virtual('minPrice').get(function () {
  if (!this.ticketTiers || this.ticketTiers.length === 0) return 0;
  return Math.min(...this.ticketTiers.map((t) => t.price));
});

EventSchema.virtual('totalCapacity').get(function () {
  if (!this.ticketTiers || !this.ticketTiers.length) return 0;
  return this.ticketTiers.reduce((sum, t) => sum + (t.capacity || 0), 0);
});

EventSchema.virtual('totalSold').get(function () {
  if (!this.ticketTiers || !this.ticketTiers.length) return 0;
  return this.ticketTiers.reduce((sum, t) => sum + (t.sold || 0), 0);
});

EventSchema.index({ 'location.city': 1, category: 1, date: 1 });

module.exports = mongoose.model('Event', EventSchema);
