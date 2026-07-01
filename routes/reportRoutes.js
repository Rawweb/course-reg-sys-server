const express = require('express');
const router = express.Router();
const {
  studentRegistrationReport,
  courseEnrollmentReport,
  prerequisiteValidationReport,
  unitLoadReport,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/student-registration', protect, authorize('admin'), studentRegistrationReport);
router.get('/course-enrollment', protect, authorize('admin'), courseEnrollmentReport);
router.get('/prerequisite-validation', protect, authorize('admin'), prerequisiteValidationReport);
router.get('/unit-load', protect, authorize('admin'), unitLoadReport);

module.exports = router;
