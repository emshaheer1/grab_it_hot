const Event = require('../models/Event');
const ContactMessage = require('../models/ContactMessage');
const TicketRequest = require('../models/TicketRequest');

exports.createContact = async (req, res, next) => {
  try {
    const { name, email, message } = req.body;
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ success: false, message: 'Name, email, and message are required' });
    }
    const doc = await ContactMessage.create({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    });
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};

exports.createTicketRequest = async (req, res, next) => {
  try {
    const { fullName, email, phone, eventId, tierId, quantity, notes } = req.body;
    if (!fullName?.trim() || !email?.trim() || !phone?.trim() || !eventId || !tierId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    const tier = event.ticketTiers.id(tierId);
    if (!tier) {
      return res.status(400).json({ success: false, message: 'Invalid ticket tier for this event' });
    }

    const qty = Math.min(50, Math.max(1, parseInt(quantity, 10) || 1));

    const doc = await TicketRequest.create({
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      event: event._id,
      eventTitle: event.title,
      tierId: tier._id,
      tierName: tier.name,
      quantity: qty,
      notes: (notes || '').trim(),
      paymentScreenshot: '',
      status: 'new',
    });

    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    next(err);
  }
};
