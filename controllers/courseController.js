const Course = require('../models/Course');
const AcademicRecord = require('../models/AcademicRecord');
const checkPrerequisites = require('../utils/checkPrerequisites');
const Registration = require('../models/Registration');
const validateRegistration = require('../utils/validateRegistration');


const getCurrentSession = () => {
  const start = 2025;
  return `${start}/${start + 1}`;
};

const getAvailableCourses = async (req, res) => {
  try {
    const student = req.user;

    if (student.role !== 'student') {
      return res.status(403).json({ message: 'Only students can view registrable courses' });
    }

    const semester = Number(req.query.semester);
    if (![1, 2].includes(semester)) {
      return res.status(400).json({ message: 'Please choose a valid semester (1 or 2)' });
    }

    const records = await AcademicRecord.find({ student: student._id });

    const passedCodes = new Set(records.filter((r) => r.grade !== 'F').map((r) => r.courseCode));

    const failedCodes = new Set(records.filter((r) => r.grade === 'F').map((r) => r.courseCode));

    const currentLevelCourses = await Course.find({
      department: student.department,
      level: student.level,
      semester,
    });

    // Mark each current-level course eligible or blocked.
    const currentCourses = currentLevelCourses.map((course) => {
      const { eligible, missing } = checkPrerequisites(course.prerequisites, passedCodes);
      return {
        courseCode: course.courseCode,
        title: course.title,
        unit: course.unit,
        level: course.level,
        semester: course.semester,
        prerequisites: course.prerequisites,
        eligible,
        blockedReason: eligible ? null : `Missing prerequisite(s): ${missing.join(', ')}`,
      };
    });

    const carryoverCourses = await Course.find({
      department: student.department,
      courseCode: { $in: Array.from(failedCodes) }, // $in = "code is one of these"
    });

    // Mark each carryover eligible or blocked too (its own prereqs still apply).
    const carryovers = carryoverCourses.map((course) => {
      const { eligible, missing } = checkPrerequisites(course.prerequisites, passedCodes);
      return {
        courseCode: course.courseCode,
        title: course.title,
        unit: course.unit,
        level: course.level,
        semester: course.semester,
        prerequisites: course.prerequisites,
        eligible,
        blockedReason: eligible ? null : `Missing prerequisite(s): ${missing.join(', ')}`,
        isCarryover: true,
      };
    });

    res.json({
      student: {
        name: student.name,
        matricNumber: student.matricNumber,
        department: student.department,
        level: student.level,
      },
      semester,
      currentCourses,
      carryovers,
    });
  } catch (error) {
    console.error(`getAvailableCourses error: ${error.message}`);
    res.status(500).json({ message: 'Server error fetching courses' });
  }
};

const submitRegistration = async (req, res) => {
  try {
    const student = req.user;

    if (student.role !== "student") {
      return res
        .status(403)
        .json({ message: "Only students can register courses" });
    }

    const { courseCodes, semester } = req.body;

    if (!Array.isArray(courseCodes) || courseCodes.length === 0) {
      return res
        .status(400)
        .json({ message: "Please select at least one course" });
    }
    if (![1, 2].includes(Number(semester))) {
      return res
        .status(400)
        .json({ message: "Please choose a valid semester (1 or 2)" });
    }

    const chosenSemester = Number(semester);
    const session = getCurrentSession(); // computed, not sent by client

    const existing = await Registration.findOne({
      student: student._id,
      session,
      semester: chosenSemester
    });
    if (existing) {
      return res.status(409).json({
        message: `You already have a ${existing.status} registration for semester ${chosenSemester}, ${session}`
      });
    }

    const courses = await Course.find({
      department: student.department,
      courseCode: { $in: courseCodes.map((c) => c.toUpperCase()) }
    });

    if (courses.length !== courseCodes.length) {
      const foundCodes = new Set(courses.map((c) => c.courseCode));
      const unknown = courseCodes
        .map((c) => c.toUpperCase())
        .filter((c) => !foundCodes.has(c));
      return res.status(400).json({
        message: `Unknown course code(s): ${unknown.join(", ")}`
      });
    }

    const records = await AcademicRecord.find({ student: student._id });
    const passedCodes = new Set(
      records.filter((r) => r.grade !== "F").map((r) => r.courseCode)
    );

    const result = validateRegistration(student, courses, passedCodes);

    if (!result.valid) {
      return res.status(400).json({
        message: "Registration is not valid",
        errors: result.errors,
        totalUnits: result.totalUnits
      });
    }

    const courseLines = courses.map((c) => ({
      courseCode: c.courseCode,
      title: c.title,
      unit: c.unit,
      level: c.level,
      isCarryover: c.level < student.level
    }));

    const registration = await Registration.create({
      student: student._id,
      matricNumber: student.matricNumber,
      department: student.department,
      level: student.level,
      session,
      semester: chosenSemester,
      courses: courseLines,
      totalUnits: result.totalUnits,
      status: "pending" 
    });

    res.status(201).json({
      message: "Registration submitted successfully and is pending approval",
      registration
    });
  } catch (error) {
    console.error(`submitRegistration error: ${error.message}`);
    res.status(500).json({ message: "Server error during registration" });
  }
};

const getMyRegistrations = async (req, res) => {
  try {
    const student = req.user;

    if (student.role !== "student") {
      return res
        .status(403)
        .json({ message: "Only students have registrations" });
    }

    const registrations = await Registration.find({ student: student._id })
      .populate("reviewedBy", "name staffId")
      .sort({ session: -1, semester: 1 }); 

    res.json({
      count: registrations.length,
      registrations
    });
  } catch (error) {
    console.error(`getMyRegistrations error: ${error.message}`);
    res.status(500).json({ message: "Server error fetching your registrations" });
  }
};

const getMyResults = async (req, res) => {
  try {
    const student = req.user;

    if (student.role !== "student") {
      return res
        .status(403)
        .json({ message: "Only students have academic records" });
    }

    const records = await AcademicRecord.find({ student: student._id })
      .sort({ level: 1, semester: 1 }); 

    const carryovers = records
      .filter((r) => r.grade === "F")
      .map((r) => r.courseCode);

    res.json({
      count: records.length,
      records,
      carryovers
    });
  } catch (error) {
    console.error(`getMyResults error: ${error.message}`);
    res.status(500).json({ message: "Server error fetching your results" });
  }
};

module.exports = { getAvailableCourses, submitRegistration, getMyRegistrations, getMyResults };
