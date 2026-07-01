const User = require('../models/User');
const Registration = require('../models/Registration');

const MIN_UNITS = 15;
const MAX_UNITS_NORMAL = 24;
const MAX_UNITS_WITH_CARRYOVER = 30;
const MINIMUM_EXEMPT_LEVEL = 400;

const studentRegistrationReport = async (req, res) => {
  try {
    const registrations = await Registration.find()
      .populate('student', 'name matricNumber')
      .sort({ department: 1, level: 1 });

    const rows = registrations.map((r) => ({
      studentId: r.matricNumber,
      studentName: r.student ? r.student.name : '(unknown)',
      department: r.department,
      level: r.level,
      status: r.status,
    }));

    res.json({ count: rows.length, rows });
  } catch (error) {
    console.error(`studentRegistrationReport error: ${error.message}`);
    res.status(500).json({ message: 'Server error generating report' });
  }
};

const courseEnrollmentReport = async (req, res) => {
  try {
    const enrollment = await Registration.aggregate([
      { $match: { status: 'approved' } },

      { $unwind: '$courses' },

      {
        $group: {
          _id: '$courses.courseCode',
          courseTitle: { $first: '$courses.title' },
          creditUnit: { $first: '$courses.unit' },
          studentsRegistered: { $sum: 1 },
        },
      },

      { $sort: { _id: 1 } },
    ]);

    const rows = enrollment.map((e) => ({
      courseCode: e._id,
      courseTitle: e.courseTitle,
      creditUnit: e.creditUnit,
      studentsRegistered: e.studentsRegistered,
    }));

    res.json({ count: rows.length, rows });
  } catch (error) {
    console.error(`courseEnrollmentReport error: ${error.message}`);
    res.status(500).json({ message: 'Server error generating report' });
  }
};

const prerequisiteValidationReport = async (req, res) => {
  try {
    const rejected = await Registration.find({ status: 'rejected' })
      .populate('student', 'name matricNumber')
      .sort({ department: 1, level: 1 });

    const rows = rejected.map((r) => ({
      studentName: r.student ? r.student.name : '(unknown)',
      matricNumber: r.matricNumber,
      department: r.department,
      level: r.level,
      coursesAppliedFor: r.courses.map((c) => c.courseCode),
      reason: r.feedback || 'Not specified',
      validationStatus: 'Rejected',
    }));

    res.json({ count: rows.length, rows });
  } catch (error) {
    console.error(`prerequisiteValidationReport error: ${error.message}`);
    res.status(500).json({ message: 'Server error generating report' });
  }
};


const unitLoadReport = async (req, res) => {
  try {
    const registrations = await Registration.find()
      .populate('student', 'name matricNumber')
      .sort({ department: 1, level: 1 });

    const rows = [];

    registrations.forEach((r) => {
      const hasCarryover = r.courses.some((c) => c.level < r.level);
      const maxAllowed = hasCarryover ? MAX_UNITS_WITH_CARRYOVER : MAX_UNITS_NORMAL;

      let status = null;

      if (r.totalUnits > maxAllowed) {
        status = 'Exceeded Limit';
      }
      else if (r.level !== MINIMUM_EXEMPT_LEVEL && r.totalUnits < MIN_UNITS) {
        status = 'Below Minimum';
      }

      if (status) {
        rows.push({
          studentName: r.student ? r.student.name : '(unknown)',
          matricNumber: r.matricNumber,
          department: r.department,
          level: r.level,
          totalRegisteredUnits: r.totalUnits,
          status,
        });
      }
    });

    res.json({ count: rows.length, rows });
  } catch (error) {
    console.error(`unitLoadReport error: ${error.message}`);
    res.status(500).json({ message: 'Server error generating report' });
  }
};

module.exports = {
  studentRegistrationReport,
  courseEnrollmentReport,
  prerequisiteValidationReport,
  unitLoadReport,
};
