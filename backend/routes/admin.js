const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getDashboardSummary,
  getAllBookings,
  getAllEvents,
  cancelBookingAsAdmin,
  deleteBookingAsAdmin,
  getContactMessages,
  getTicketRequests,
  markNewTicketRequestsReviewed,
  deleteContactMessage,
  deleteTicketRequest,
} = require('../controllers/adminController');

router.get('/summary', protect, authorize('admin'), getDashboardSummary);
router.get('/bookings', protect, authorize('admin'), getAllBookings);
router.get('/events', protect, authorize('admin'), getAllEvents);
router.put('/bookings/:id/cancel', protect, authorize('admin'), cancelBookingAsAdmin);
router.delete('/bookings/:id', protect, authorize('admin'), deleteBookingAsAdmin);
router.get('/contacts', protect, authorize('admin'), getContactMessages);
router.get('/ticket-requests', protect, authorize('admin'), getTicketRequests);
// GET avoids some proxies/WAFs mishandling POST; POST kept for compatibility
router.get('/notifications/clear-ticket-requests', protect, authorize('admin'), markNewTicketRequestsReviewed);
router.post('/ticket-requests/mark-reviewed', protect, authorize('admin'), markNewTicketRequestsReviewed);
router.delete('/contacts/:id', protect, authorize('admin'), deleteContactMessage);
router.delete('/ticket-requests/:id', protect, authorize('admin'), deleteTicketRequest);

module.exports = router;
