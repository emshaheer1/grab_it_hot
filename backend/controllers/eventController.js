const Event = require('../models/Event');

exports.getEvents = async (req, res, next) => {
  try {
    const { city, state, category, minPrice, maxPrice, date, search, page = 1, limit = 9 } = req.query;
    const query = { status: { $in: ['upcoming', 'ongoing'] } };

    if (city) query['location.city'] = { $regex: city, $options: 'i' };
    if (state) query['location.state'] = { $regex: state, $options: 'i' };
    if (category) query.category = category;
    if (date) {
      const d = new Date(date);
      query.date = { $gte: d, $lt: new Date(d.getTime() + 86400000) };
    }
    if (search) query.$or = [{ title: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }];
    if (minPrice || maxPrice) {
      query['ticketTiers.price'] = {};
      if (minPrice) query['ticketTiers.price'].$gte = Number(minPrice);
      if (maxPrice) query['ticketTiers.price'].$lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Event.countDocuments(query);
    const events = await Event.find(query).sort({ date: 1 }).skip(skip).limit(Number(limit));

    res.json({ success: true, count: events.length, total, pages: Math.ceil(total / limit), data: events });
  } catch (err) {
    next(err);
  }
};

exports.getFeaturedEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ featured: true, status: 'upcoming' }).limit(24).sort({ date: 1 });
    res.json({ success: true, data: events });
  } catch (err) {
    next(err);
  }
};

exports.getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
};

const buildEventFromMultipart = (req) => {
  const body = req.body || {};
  const image = req.file ? `/uploads/${req.file.filename}` : undefined;
  return {
    title: body.title,
    description: (body.description && String(body.description).trim())
      || `${body.title} - event managed by admin dashboard.`,
    category: body.category,
    date: body.date,
    location: {
      venue: body.venue,
      city: body.city,
      state: body.state,
    },
    organizer: { name: body.organizerName || 'Admin Team' },
    ticketTiers: [
      {
        name: 'General Admission',
        price: Number(body.price),
        capacity: Number(body.capacity),
      },
    ],
    featured: body.featured === 'true' || body.featured === true,
    ...(image ? { image } : {}),
  };
};

exports.createEvent = async (req, res, next) => {
  try {
    const multipart = (req.headers['content-type'] || '').includes('multipart/form-data');
    const payload = multipart && req.body?.title ? buildEventFromMultipart(req) : { ...req.body };
    if (!multipart && req.file) {
      payload.image = `/uploads/${req.file.filename}`;
    }
    const event = await Event.create(payload);
    res.status(201).json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
};

exports.updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const body = req.body && typeof req.body === 'object' ? { ...req.body } : {};
    if (req.file) {
      event.image = `/uploads/${req.file.filename}`;
    }

    const scalarKeys = ['title', 'description', 'category', 'date', 'endDate', 'status', 'featured', 'promoCode', 'promoDiscount', 'image', 'dateComingSoon'];
    scalarKeys.forEach((key) => {
      if (body[key] !== undefined) event[key] = body[key];
    });

    event.location = event.location || {};
    const locIn = body.location && typeof body.location === 'object' && !Array.isArray(body.location) ? body.location : {};
    const venue = locIn.venue ?? body['location.venue'];
    const city = locIn.city ?? body['location.city'];
    const state = locIn.state ?? body['location.state'];
    const address = locIn.address ?? body['location.address'];
    const zipCode = locIn.zipCode ?? body['location.zipCode'];
    if (venue !== undefined) event.location.venue = venue;
    if (city !== undefined) event.location.city = city;
    if (state !== undefined) event.location.state = state;
    if (address !== undefined) event.location.address = address;
    if (zipCode !== undefined) event.location.zipCode = zipCode;

    if (body.organizer && typeof body.organizer === 'object') {
      event.organizer = { ...(event.organizer?.toObject?.() ?? event.organizer ?? {}), ...body.organizer };
    }
    if (body['organizer.name'] !== undefined) {
      event.organizer = event.organizer || {};
      event.organizer.name = body['organizer.name'];
    }
    if (body['organizer.email'] !== undefined) {
      event.organizer = event.organizer || {};
      event.organizer.email = body['organizer.email'];
    }
    if (body['organizer.phone'] !== undefined) {
      event.organizer = event.organizer || {};
      event.organizer.phone = body['organizer.phone'];
    }
    if (!String(event.organizer?.name || '').trim()) {
      const prev = event.organizer?.toObject?.() ?? event.organizer ?? {};
      event.organizer = { ...prev, name: 'Admin Team' };
    }

    if (Array.isArray(body.ticketTiers)) {
      event.ticketTiers = body.ticketTiers;
    }

    await event.save();
    res.json({ success: true, data: event });
  } catch (err) {
    next(err);
  }
};

exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, message: 'Event deleted' });
  } catch (err) {
    next(err);
  }
};
