const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const { sendMail, getMailTransportType } = require('../utils/mailTransport');
const { getAdminAlertRecipients } = require('../utils/adminAlerts');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const ContactMessage = require('../models/ContactMessage');
const TicketRequest = require('../models/TicketRequest');

function parseOrderIdFromNotes(notes) {
  if (!notes || typeof notes !== 'string') return '';
  const m = notes.match(/Order ID:\s*([^\s\n]+)/i);
  return m ? m[1].trim() : '';
}

function parseAmountFromNotes(notes) {
  if (!notes || typeof notes !== 'string') return '';
  const m = notes.match(/(?:Zelle amount due|Estimated total):\s*(\$[0-9,]+(?:\.[0-9]{1,2})?)/i);
  return m ? m[1].trim() : '';
}

/** Match admin dashboard datetime style for Excel (e.g. Wed, Aug 5, 2026 · 3:15 PM) */
function formatCsvDateTime(date) {
  if (!date) return '';
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
      .format(new Date(date))
      .replace(',', '')
      .replace(/ (\d{1,2}:\d{2})/, ' · $1');
  } catch {
    return String(date);
  }
}

function escapeCsvCell(value) {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsvLine(cells) {
  return cells.map(escapeCsvCell).join(',');
}

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
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const filter = {};

    if (req.query.eventId) filter.event = req.query.eventId;
    if (req.query.status === 'new') filter.status = 'new';
    if (req.query.status === 'reviewed') filter.status = 'reviewed';

    const [rows, total] = await Promise.all([
      TicketRequest.find(filter)
        .populate('event', 'title date location')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      TicketRequest.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: rows.length,
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getTicketRequestGroups = async (req, res, next) => {
  try {
    const groups = await TicketRequest.aggregate([
      {
        $group: {
          _id: '$event',
          eventTitle: { $first: '$eventTitle' },
          total: { $sum: 1 },
        },
      },
      { $sort: { eventTitle: 1 } },
    ]);

    res.json({
      success: true,
      data: groups.map((g) => ({
        eventId: g._id,
        eventTitle: g.eventTitle || 'Unknown event',
        total: g.total,
      })),
    });
  } catch (err) {
    next(err);
  }
};

exports.exportTicketRequestsCsv = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.eventId) filter.event = req.query.eventId;

    // Full dataset — no pagination
    const rows = await TicketRequest.find(filter)
      .populate('event', 'title date location')
      .sort({ createdAt: -1 })
      .lean();

    // Same fields as the admin ticket-request table (+ Event / Amount for Excel)
    const headers = [
      'Received',
      'Buyer',
      'Email',
      'Phone',
      'Event',
      'Order ID',
      'Tier',
      'Quantity',
      'Amount',
      'Status',
    ];

    const lines = [toCsvLine(headers)];
    for (const row of rows) {
      lines.push(
        toCsvLine([
          formatCsvDateTime(row.createdAt),
          row.fullName || '',
          row.email || '',
          row.phone || '',
          row.eventTitle || row.event?.title || '',
          parseOrderIdFromNotes(row.notes) || '',
          row.tierName || '',
          row.quantity ?? '',
          parseAmountFromNotes(row.notes) || '',
          row.status || '',
        ])
      );
    }

    const stamp = new Date().toISOString().slice(0, 10);
    const eventSlug = req.query.eventId ? `event-${String(req.query.eventId).slice(-6)}-` : '';
    const filename = `ticket-requests-${eventSlug}${stamp}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    // UTF-8 BOM so Excel opens columns correctly
    res.send(`\uFEFF${lines.join('\r\n')}\r\n`);
  } catch (err) {
    next(err);
  }
};

/** Clears admin notification badge: all (or one event’s) non-reviewed ticket requests become reviewed */
exports.markNewTicketRequestsReviewed = async (req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store');
    const eventId = req.query.eventId || req.body?.eventId;
    const filter = { status: { $ne: 'reviewed' } };
    if (eventId) filter.event = eventId;
    const result = await TicketRequest.updateMany(filter, { $set: { status: 'reviewed' } });
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

exports.testMail = async (req, res, next) => {
  try {
    const recipients = getAdminAlertRecipients();
    const to = String(req.body?.to || recipients[0] || '').trim();
    if (!to) {
      return res.status(400).json({
        success: false,
        message: 'Set ADMIN_ALERT_EMAIL on the server or pass { "to": "you@example.com" }',
      });
    }

    const result = await sendMail({
      to,
      subject: 'Grab It Hot — test email',
      text: 'If you received this, production email is working.',
      html: '<p>If you received this, <strong>production email is working</strong>.</p>',
    });

    res.json({
      success: result.ok,
      transport: getMailTransportType(),
      to,
      ...(result.ok ? { message: 'Test email sent' } : { message: result.error || 'Send failed' }),
    });
  } catch (err) {
    next(err);
  }
};
