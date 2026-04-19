const express = require('express');
const router = express.Router();
const { createContact } = require('../controllers/submissionController');

router.post('/', createContact);

module.exports = router;
