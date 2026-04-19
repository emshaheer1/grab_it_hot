const express = require('express');
const router = express.Router();
const { createTicketRequest } = require('../controllers/submissionController');

router.post('/', createTicketRequest);

module.exports = router;
