const checkPrerequisites = require('./checkPrerequisites');

const MIN_UNITS = 15;
const MAX_UNITS_NORMAL = 24;
const MAX_UNITS_WITH_CARRYOVER = 30;
const MINIMUM_EXEMPT_LEVEL = 400;

const validateRegistration = (student, selectedCourses, passedCodesSet) => {
  const errors = [];
  const currentLevel = student.level;

  if (!selectedCourses || selectedCourses.length === 0) {
    return {
      valid: false,
      totalUnits: 0,
      hasCarryover: false,
      errors: ['You have not selected any courses'],
    };
  }

  let hasCarryover = false;

  selectedCourses.forEach((course) => {
    const { eligible, missing } = checkPrerequisites(course.prerequisites, passedCodesSet);
    if (!eligible) {
      errors.push(
        `${course.courseCode} is blocked — missing prerequisite(s): ${missing.join(', ')}`,
      );
    }

    if (course.level < currentLevel) {
      hasCarryover = true;
    }
  });

  const totalUnits = selectedCourses.reduce((sum, c) => sum + c.unit, 0);

  const maxUnits = hasCarryover ? MAX_UNITS_WITH_CARRYOVER : MAX_UNITS_NORMAL;

  if (totalUnits > maxUnits) {
    errors.push(
      `Total is ${totalUnits} units, above the ${maxUnits}-unit maximum` +
        (hasCarryover ? ' (carryover limit)' : ''),
    );
  }

  if (currentLevel !== MINIMUM_EXEMPT_LEVEL && totalUnits < MIN_UNITS) {
    errors.push(`Total is ${totalUnits} units, below the ${MIN_UNITS}-unit minimum`);
  }

  return {
    valid: errors.length === 0,
    totalUnits,
    hasCarryover,
    errors,
  };
};

module.exports = validateRegistration;
