// routes/courseRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAvailableCourses,
  submitRegistration,
  getMyRegistrations,
  getMyResults,
} = require('../controllers/courseController');
const { protect } = require('../middleware/authMiddleware');

router.get('/available', protect, getAvailableCourses);
router.post('/register', protect, submitRegistration);
router.get('/my-registrations', protect, getMyRegistrations);
router.get('/my-results', protect, getMyResults);
module.exports = router;
