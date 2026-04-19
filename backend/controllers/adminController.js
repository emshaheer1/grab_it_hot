const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const ContactMessage = require('../models/ContactMessage');
const TicketRequest = require('../models/TicketRequest');

const restoreCapacityIfNeeded = async (booking) => {
  if (!booking || booking.status !== 'confirmed') return;
  const event = await Event.findById(booking.event);
  if (!event) return;
  const tier = event.ticketTiers.id(booking.ticketTier?.tierId);
  if (!tier) return;
  tier.sold = Math.max(0, tier.sold - booking.quantity);
  await event.save();
};

exports.getDashboardSummary = async (req, res, next) => {
  try {
    const [totalUsers, totalEvents, totalBookings, bookings, contactMessages, ticketRequests] = await Promise.all([
      User.countDocuments(),
      Event.countDocuments(),
      Booking.countDocuments(),
      Booking.find({ status: 'confirmed' }).select('totalAmount'),
      ContactMessage.countDocuments(),
      TicketRequest.countDocuments(),
    ]);

    const confirmedRows = Array.isArray(bookings) ? bookings : [];
    const totalRevenue = confirmedRows.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    const [recentBookings, recentUsers, recentEvents] = await Promise.all([
      Booking.find()
        .populate('user', 'name email')
        .populate('event', 'title date location')
        .sort({ createdAt: -1 })
        .limit(6),
      User.find().select('name email role createdAt').sort({ createdAt: -1 }).limit(6),
      Event.find()
        .select('title category status date location featured createdAt')
        .sort({ createdAt: -1 })
        .limit(6),
    ]);

    res.json({
      success: true,
      data: {
        metrics: {
          totalUsers,
          totalEvents,
          totalBookings,
          totalRevenue,
          contactMessages,
          ticketRequests,
        },
        recentBookings,
        recentUsers,
        recentEvents,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getAllBookings = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const bookings = await Booking.find(query)
      .populate('user', 'name email')
      .populate('event', 'title date location')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    next(err);
  }
};

exports.getAllEvents = async (req, res, next) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.json({ success: true, count: events.length, data: events });
  } catch (err) {
    next(err);
  }
};

exports.cancelBookingAsAdmin = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Booking already cancelled' });
    }

    await restoreCapacityIfNeeded(booking);
    booking.status = 'cancelled';
    await booking.save();

    res.json({ success: true, message: 'Booking cancelled by admin', data: booking });
  } catch (err) {
    next(err);
  }
};

exports.deleteBookingAsAdmin = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    await restoreCapacityIfNeeded(booking);
    await User.findByIdAndUpdate(booking.user, { $pull: { bookings: booking._id } });
    await Booking.findByIdAndDelete(booking._id);

    res.json({ success: true, message: 'Booking deleted by admin' });
  } catch (err) {
    next(err);
  }
};

exports.getContactMessages = async (req, res, next) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.json({ success: true, count: messages.length, data: messages });
  } catch (err) {
    next(err);
  }
};

exports.getTicketRequests = async (req, res, next) => {
  try {
    const rows = await TicketRequest.find()
      .populate('event', 'title date location')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    next(err);
  }
};

/** Clears admin notification badge: all non-reviewed ticket requests become reviewed */
exports.markNewTicketRequestsReviewed = async (req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store');
    const result = await TicketRequest.updateMany(
      { status: { $ne: 'reviewed' } },
      { $set: { status: 'reviewed' } }
    );
    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (err) {
    next(err);
  }
};

exports.deleteContactMessage = async (req, res, next) => {
  try {
    const doc = await ContactMessage.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Message not found' });
    res.json({ success: true, message: 'Message deleted' });
  } catch (err) {
    next(err);
  }
};

exports.deleteTicketRequest = async (req, res, next) => {
  try {
    const doc = await TicketRequest.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: 'Request not found' });

    const shot = doc.paymentScreenshot;
    if (shot && shot.startsWith('/uploads/')) {
      const fp = path.join(__dirname, '..', shot.replace(/^\//, ''));
      fs.unlink(fp, () => {});
    }
    await doc.deleteOne();
    res.json({ success: true, message: 'Ticket request deleted' });
  } catch (err) {
    next(err);
  }
};
