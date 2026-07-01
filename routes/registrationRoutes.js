const express = require('express');
const router = express.Router();
const {
  getPendingRegistrations,
  reviewRegistration,
} = require('../controllers/registrationController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/pending', protect, authorize('lecturer'), getPendingRegistrations);
router.put('/:id/review', protect, authorize('lecturer'), reviewRegistration);
module.exports = router;
