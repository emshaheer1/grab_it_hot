const express = require('express');
const router = express.Router();
const { getEvents, getEvent, createEvent, updateEvent, deleteEvent, getFeaturedEvents } = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/auth');
const { optionalEventImageUpload } = require('../middleware/upload');

router.get('/', getEvents);
router.get('/featured', getFeaturedEvents);
router.get('/:id', getEvent);
router.post('/', protect, authorize('admin'), optionalEventImageUpload, createEvent);
router.put('/:id', protect, authorize('admin'), optionalEventImageUpload, updateEvent);
router.delete('/:id', protect, authorize('admin'), deleteEvent);

module.exports = router;
